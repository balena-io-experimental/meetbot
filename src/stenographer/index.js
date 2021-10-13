console.log("[stenographer] loaded");

// List of ids for all recorded hangouts
const KEY_TRANSCRIPT_IDS = "meetbot-recordings";

// Used to identify when the user is the speaker when listing the meeting participants
const SEARCH_TEXT_SPEAKER_NAME_YOU = "You";

// Used to identify when a meeting has no name
const SEARCH_TEXT_NO_MEETING_NAME = "Meeting details";

// Search through this many comments when determining meeting participants
const MAX_PARTICIPANT_SEARCH_DEPTH = 100;

// Label given to conversations with no other participants
const NAME_YOURSELF = "yourself";

let state = {
  captionsContainer: null,
  closedCaptionsAttachInterval: null,
  currentTranscriptId: null,
  currentSessionIndex: null,
};

let settings = {
  speakerNameMap: {},
  transcriptFormatSpeaker: "**$hour$:$minute$ $name$:** $text$",
  transcriptFormatMeeting: "# $year$-$month$-$day$ $name$\n\n$text$",
  transcriptFormatSessionJoin: "\n\n...\n\n",
  transcriptFormatSpeakerJoin: "\n\n",
  hideCaptionsWhileRecording: false,
  readonly: false,
  debug: true,
}

// -------------------------------------------------------------------------
// cache is an array of speakers and comments
//
// each entry contains:
//   Speaker name, avatar, and comment
//     person
//     image
//     text
//
//   Start and end timestamps of comment
//     startedAt
//     endedAt
//
//   Used to generate key when writing to local storage
//     speakerIndex
//
//   Stored for tracking / debugging
//     node
//     count
//     pollCount
// -------------------------------------------------------------------------
const cache = [];

////////////////////////////////////////////////////////////////////////////
// Local storage persistence
//
// Prefix for all keys: __gmt_v1_
//  (__gmt_ when version is null, e.g. '_gmt_version')
//
// setting.speaker-format -> the formatting string used when copying
//                            conversations to the cliboard
//                            default: **HH:MM Name:** comment\n
//
// setting.speaker-name-map -> speaker names can be altered when copying
//                              conversations. Names matching keys in this
//                              object will be mapped to their respective
//                              values
//
// hangouts = [<id>, ...]
//
// hangout_<id> = number of sessions
//
// hangout_<id>_session_<index> = number of speakers
//
// hangout_<id>_session_<index>_speaker_<index> = {
//   person     the name of the speaker
//   image      the url to the speaker's avatar
//   text       the final transcription of the speaker's comment
//   startedAt  when the speaker began making this comment
//   endedAt    when the speaker finished making this comment
// }
////////////////////////////////////////////////////////////////////////////

// -------------------------------------------------------------------------
// make a localStorage key with the version prefixed
// -------------------------------------------------------------------------
const makeFullKey = (key) => {
  return `__meetbot_${key}`;
};

// -------------------------------------------------------------------------
// make a localStorage key for hangouts following the format above
// -------------------------------------------------------------------------
const makeTranscriptKey = (...args) => {
  const [transcriptId, sessionIndex, speakerIndex] = args;

  const keyParts = [`meet_${transcriptId}`];

  if (args.length >= 2) {
    keyParts.push(`session_${sessionIndex}`);

    if (args.length >= 3) {
      keyParts.push(`speaker_${speakerIndex}`);
    }
  }

  return keyParts.join("_");
};

// -------------------------------------------------------------------------
// retrieve a key from localStorage parsed as JSON
// -------------------------------------------------------------------------
const get = (key) => {
  const raw = window.localStorage.getItem(makeFullKey(key));
  if (typeof raw === "string" || raw instanceof String) {
    debug(key, raw);
    return JSON.parse(raw);
  } else {
    return raw;
  }
};

// -------------------------------------------------------------------------
// retrieve a key in localStorage stringified as JSON
// -------------------------------------------------------------------------
const set = (key, value) => {
  window.localStorage.setItem(makeFullKey(key), JSON.stringify(value));
};

// -------------------------------------------------------------------------
// delete a key from localStorage
// -------------------------------------------------------------------------
const remove = (key) => {
  debug(`remove ${makeFullKey(key)}`);
  if (!settings.readonly) {
    window.localStorage.removeItem(makeFullKey(key));
  }
};

// -------------------------------------------------------------------------
// get a key from local storage and set it to the default if it doesn't
// exist yet
// -------------------------------------------------------------------------
const getOrSet = (key, defaultValue) => {
  const value = get(key, version);
  if (value === undefined || value === null) {
    set(key, defaultValue);
    return defaultValue;
  } else {
    return value;
  }
};

// -------------------------------------------------------------------------
// increment a key in local storage, set to to 0 if it doesn't exist
// -------------------------------------------------------------------------
const increment = (key) => {
  const current = get(key);

  if (current === undefined || current === null) {
    set(key, 0);
    return 0;
  } else {
    let next = current + 1;
    set(key, next);
    return next;
  }
};

////////////////////////////////////////////////////////////////////////////
// DOM Utilities
////////////////////////////////////////////////////////////////////////////

// -------------------------------------------------------------------------
// create a list of all ancestor nodes
// -------------------------------------------------------------------------
const parents = (node) => {
  const nodes = [node];
  for (; node; node = node.parentNode) {
    nodes.unshift(node);
  }
  return nodes;
};

// -------------------------------------------------------------------------
// find the common ancestor of two nodes if one exists
// -------------------------------------------------------------------------
const getCommonAncestor = (node1, node2) => {
  const parents1 = parents(node1);
  const parents2 = parents(node2);

  if (parents1[0] === parents2[0]) {
    for (let i = 0; i < parents1.length; i++) {
      if (parents1[i] !== parents2[i]) {
        return parents1[i - 1];
      }
    }
  }
};

// -------------------------------------------------------------------------
// execute an xpath query and return the first matching node
// -------------------------------------------------------------------------
const xpath = (search, root = document) => {
  return document.evaluate(
    search,
    root,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE
  ).singleNodeValue;
};

////////////////////////////////////////////////////////////////////////////
// General utilities
////////////////////////////////////////////////////////////////////////////

// -------------------------------------------------------------------------
// pad numbers 0-9 with 0
// -------------------------------------------------------------------------
const pad = (integer) => {
  if (integer < 10) {
    return `0${integer}`;
  } else {
    return integer;
  }
};

// -------------------------------------------------------------------------
// console.log only if DEBUG is true
// -------------------------------------------------------------------------
const debug = (...args) => {
  if (settings.debug) {
    console.log("[stenographer]", ...args);
  }
};

// -------------------------------------------------------------------------
// await the function and return its value, logging an error if it rejects
// -------------------------------------------------------------------------
const tryTo =
  (fn, label) =>
    async (...args) => {
      try {
        return await fn(...args);
      } catch (e) {
        console.error(`error ${label}:`, e);
      }
    };

////////////////////////////////////////////////////////////////////////////
// Caption Controls
////////////////////////////////////////////////////////////////////////////

const turnCaptionsOn = () => {
  const captionsButtonOn = xpath(
    `//div[text()='Turn on captions (c)']/preceding-sibling::button`,
    document
  );
  if (captionsButtonOn) {
    captionsButtonOn.click();
    weTurnedCaptionsOn = true;
  }
};

const turnCaptionsOff = () => {
  const captionsButtonOff = xpath(
    `//div[text()='Turn off captions (c)']/preceding-sibling::button`,
    document
  );
  if (captionsButtonOff) {
    captionsButtonOff.click();
    weTurnedCaptionsOn = false;
  }
};

////////////////////////////////////////////////////////////////////////////
// Transcribing Controls
////////////////////////////////////////////////////////////////////////////

const startTranscribing = () => {
  if (state.closedCaptionsAttachInterval) {
    clearInterval(state.closedCaptionsAttachInterval);
  }

  // set this to null to force it to increment
  state.currentSessionIndex = null;

  state.closedCaptionsAttachInterval = setInterval(
    tryTo(closedCaptionsAttachLoop, "attach to captions"),
    1000
  );
  setCurrentTranscriptDetails();

  turnCaptionsOn();
};

////////////////////////////////////////////////////////////////////////////
// Transcript reading and writing
////////////////////////////////////////////////////////////////////////////

// -------------------------------------------------------------------------
// Copy all of the speakers for each session of a transcript to clipboard
//
// Uses the format TRANSCRIPT_FORMAT_SPEAKER (setting.speaker-format) and the speaker
// name map SPEAKER_NAME_MAP (settiong.speaker-name-map).
// -------------------------------------------------------------------------
const getTranscript = (transcriptId) => {

  const maxSessionIndex = get(makeTranscriptKey(transcriptId)) || 0;

  const transcript = [];

  for (
    let sessionIndex = 0;
    sessionIndex <= maxSessionIndex;
    sessionIndex += 1
  ) {
    const maxSpeakerIndex =
      get(makeTranscriptKey(transcriptId, sessionIndex)) || 0;

    const speakers = [];

    for (
      let speakerIndex = 0;
      speakerIndex <= maxSpeakerIndex;
      speakerIndex += 1
    ) {
      const item = get(
        makeTranscriptKey(transcriptId, sessionIndex, speakerIndex)
      );

      if (item && item.text && item.text.match(/\S/g)) {
        const date = new Date(item.startedAt);
        const minutes = date.getMinutes();

        const name = item.person;

        const text = settings.transcriptFormatSpeaker.replace(
          "$hour$",
          date.getHours()
        ).replace(
          "$minute$", pad(minutes)
        ).replace(
          "$name$", name
        ).replace("$text$", item.text);

        speakers.push(text);
      }
    }

    const sessionTranscript = speakers.join(settings.transcriptFormatSpeakerJoin);

    if (sessionTranscript) {
      transcript.push(sessionTranscript);
    }
  }

  const { name, year, month, day } = getTranscriptNameParts(transcriptId);

  return settings.transcriptFormatMeeting.replace("$year$", year)
    .replace("$month$", pad(month))
    .replace("$day$", pad(day))
    .replace("$name$", name)
    .replace("$text$", transcript.join(
      settings.transcriptFormatSessionJoin
    ));
};

// -------------------------------------------------------------------------
// Update the localStorage entry for this transcript + session + speaker
// -------------------------------------------------------------------------
const upsertRecord = (cache) => {

  let entry = {
    image: cache.image,
    person: cache.person,
    text: cache.text,
    startedAt: cache.startedAt,
    endedAt: cache.endedAt,
  }

  if (handleCaption !== undefined) {
    handleCaption(entry)
  }

  set(
    makeTranscriptKey(
      cache.transcriptId,
      cache.sessionIndex,
      cache.speakerIndex
    ),
    {
      image: cache.image,
      person: cache.person,
      text: cache.text,
      startedAt: cache.startedAt,
      endedAt: cache.endedAt,
    }
  );
};

////////////////////////////////////////////////////////////////////////////
// transcript and session identification
////////////////////////////////////////////////////////////////////////////

// -------------------------------------------------------------------------
// Find meeting name from footer
// -------------------------------------------------------------------------
const getMeetingName = () => {
  const name = xpath(
    `//*[text()='keyboard_arrow_up']/../..//div[@jscontroller!='']/text()`
  );
  if (name && name.data !== "Meeting details") {
    return name.data;
  }
};

// -------------------------------------------------------------------------
// Identify the current transcript id based on the URL. Invoked whenever we
// start trancribing.
// -------------------------------------------------------------------------
const setCurrentTranscriptDetails = () => {

  const now = new Date();
  const dateString = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

  const pathString = document.location.pathname.match(/\/(.+)/)[1];
  const newTranscriptId = `${pathString}-${dateString}`;
  const isTranscriptIdChanged = newTranscriptId !== state.currentTranscriptId;

  if (isTranscriptIdChanged || state.currentSessionIndex === null) {
    state.currentTranscriptId = newTranscriptId;

    const transcriptIds = get(KEY_TRANSCRIPT_IDS) || [];

    if (!transcriptIds.includes(state.currentTranscriptId)) {
      transcriptIds.unshift(state.currentTranscriptId);
      set(KEY_TRANSCRIPT_IDS, transcriptIds);
    }

    state.currentSessionIndex = increment(`meet_${state.currentTranscriptId}`);

    debug({
      currentTranscriptId: state.currentTranscriptId,
      currentSessionIndex: state.currentSessionIndex
    });

    if (isTranscriptIdChanged) {
      const name = getMeetingName();
      if (name) {
        set(`${makeTranscriptKey(state.currentTranscriptId)}_name`, name);
      }
    }
  }
};

////////////////////////////////////////////////////////////////////////////
// Captions element processing
////////////////////////////////////////////////////////////////////////////

// -------------------------------------------------------------------------
// Grab the speaker details and comment text for a caption node
// -------------------------------------------------------------------------
const getCaptionData = (node) => {
  const image = node.querySelector("img");
  const person = xpath(".//div/text()", node);
  const spans = Array.from(node.querySelectorAll("span")).filter(
    (span) => span.children.length === 0
  );
  const text = spans.map((span) => span.textContent).join(" ");
  console.log(text)
  return {
    image: image ? image.src : '',
    person: person ? person.textContent : '',
    text,
  };
};

// -------------------------------------------------------------------------
// process a change to a caption node
//
// If the nodes isn't being tracked yet, grab the full comment text, start
// tracking the node, and start polling to record and save changes. The
// goal is minimize the performance impact by capturing and saving the
// comment once at the beginning, once at the end, and every 1 second
// inbetween. This is reduces the amount of work done significantly for
// longer comments.
//
// NOTE: It could be adjusted to only act on the last debounce if there was
// not already a poll between the last change and time of the final call
// -------------------------------------------------------------------------
const updateCurrentTranscriptSession = (node) => {

	console.log("node being")
  const index = cache.findIndex((el) => el.node === node);

  // If node is not being tracked
  if (index === -1) {

    const currentSpeakerIndex = increment(
      makeTranscriptKey(state.currentTranscriptId, state.currentSessionIndex)
    );

    cache.unshift({
      ...getCaptionData(node),
      startedAt: new Date(),
      endedAt: new Date(),
      node,
      count: 0,
      pollCount: 0,
      transcriptId: state.currentTranscriptId,
      sessionIndex: state.currentSessionIndex,
      speakerIndex: currentSpeakerIndex,
    });

    upsertRecord(cache[0]);

  } else {

    const _cache = cache[index];

    if (_cache.debounce) {
      clearInterval(_cache.debounce);
    }

    _cache.count += 1;
    _cache.endedAt = new Date();

    _cache.debounce = setInterval(
      tryTo(() => {
        _cache.text = getCaptionData(node).text;
        // debug('count', cache.count, 'polls', cache.pollCount);
        upsertRecord(_cache);
        clearInterval(_cache.debounce);
        clearInterval(_cache.poll);
        delete _cache.poll;
      }, "trailing caption poll"),
      1000
    );

    if (!("poll" in _cache)) {
      _cache.poll = setInterval(
        tryTo(() => {
          _cache.pollCount += 1;
          _cache.text = getCaptionData(node).text;
          // debug('count', cache.count, 'polls', cache.pollCount);
          upsertRecord(_cache);
        }, "caption polling"),
        1000
      );
    }
  }
};

////////////////////////////////////////////////////////////////////////////
// Captions element location and observation
////////////////////////////////////////////////////////////////////////////

// -------------------------------------------------------------------------
// Locate captions container in the DOM and attach an observer
//
// Strategy for finding the node for Google's closed captions:
//
// 1. find all img nodes from googleusercontent.com
// 2. partition img nodes by class
// 3. for each class, compute lowest common ancescestor of the first two
//    nodes
// 4. check that it is the lowest common ancestor for rest of class
// 5. check that each node within the class has a sibling/nephew that is a
//    leaf node with text
// 6. check that node is centered or starts in the bottom left corner and
//    ends between 40-90% to the right
// -------------------------------------------------------------------------
const findCaptionsContainer = () => {

  captionContainerChildObserver.disconnect();
  captionContainerAttributeObserver.disconnect();

  const nodesByClass = {};

  const nodes = Array.from(document.querySelectorAll("img")).filter((node) => {
    return node.src.match(/\.googleusercontent\.com\//);
  });

  for (let node of nodes) {
    if (!(node.clasName in nodesByClass)) {
      nodesByClass[node.className] = [];
    }

    nodesByClass[node.className].push(node);
  }

  const candidates = [];

  for (let classNodes of Object.values(nodesByClass)) {
    let matches = 0;

    for (let node of classNodes) {
      const spans = document.evaluate(
        `..//span`,
        node.parentElement,
        null,
        XPathResult.ORDERED_NODE_ITERATOR_TYPE
      );

      let span;

      while ((span = spans.iterateNext())) {
        if (span.children.length === 0 && span.textContent.length > 3) {
          matches += 1;
          break;
        }
      }
    }

    if (matches !== classNodes.length) {
      continue;
    }

    let candidate = null;

    if (classNodes.length >= 2) {
      const nodeCopy = [...classNodes];
      let current = null;
      let noSharedCommonAncestor = false;

      do {
        for (let i in nodeCopy) {
          if (!nodeCopy[i].parent) {
            noSharedCommonAncestor = true;
            break;
          }

          nodeCopy[i] = nodeCopy[i].parent;

          if (i === 0) {
            current = nodeCopy[i];
          } else if (current && current !== nodeCopy[i]) {
            current = null;
          }
        }
      } while (current === null && noSharedCommonAncestor === false);

      candidate = current;
    } else {
      let node = classNodes[0];
      while (candidate === null && node) {
        if (node.getAttribute("jscontroller")) {
          candidate = node;
        } else {
          node = node.parentNode;
        }
      }
    }

    if (candidate) {
      const windowWidth = window.innerWidth;

      const rect = candidate.children[0].getBoundingClientRect();
      const isCentered = Math.abs(rect.x - rect.left) < 10;
      const isThreeFifthsWidth =
        Math.abs(((rect.x + rect.left) * 3) / 2 - rect.width) < 10;

      const isLeftAligned = rect.left < windowWidth * 0.2;
      const isNotRightAligned = rect.right < windowWidth * 0.9;
      const isWiderThanHalf = rect.right > windowWidth * 0.5;

      // NOTE: could be more precise about location
      // NOTE: could explore factors that lead one of these situations to be
      //       true and then only accept candidates matching the expected case

			// NOTE: Is this a horrible hack? Yes.
      // if (
      //   (isCentered && isThreeFifthsWidth) ||
      //   (isLeftAligned && isNotRightAligned && isWiderThanHalf)
      // ) {
        candidates.push(candidate);
      // }
    }
  }

	// NOTE: Is this a horrible hack? Yes.
	candidates.forEach((candidate) => {
  // if (candidates.length === 1) {
    captionContainerChildObserver.observe(candidate, {
      childList: true,
      subtree: true,
    });

    captionContainerAttributeObserver.observe(candidate, {
      attributes: true,
      subtree: false,
      attributeOldValue: true,
    });

    Array.from(candidate.children).forEach(
      tryTo((child) => {
        updateCurrentTranscriptSession(child);
      }, "handling child node")
    );

    return candidates[0];
  // }
})

};

// -------------------------------------------------------------------------
// Define MutationObserver to observe the caption container
//
// NOTE: not a function
// -------------------------------------------------------------------------
const captionContainerChildObserver = new MutationObserver(
  tryTo((mutations) => {
    for (let mutation of mutations) {
      if (mutation.target === state.captionsContainer) {
        for (let node of mutation.addedNodes) {
          updateCurrentTranscriptSession(node);
        }

        // for (let node of mutation.removedNodes) {
        //   updateCurrentTranscriptSession(node);
        // }
      } else {
        const addedSpans = Array.from(mutation.addedNodes).filter((node) => {
          return (
            node.nodeName === "SPAN" &&
            node.children &&
            node.children.length === 0
          );
        });

        const removedSpans = Array.from(mutation.removedNodes).filter(
          (node) => {
            return (
              node.nodeName === "SPAN" &&
              node.children &&
              node.children.length === 0
            );
          }
        );

        if (addedSpans.length > 0 || removedSpans.length > 0) {
          let node = mutation.target;

          while (node && node.parentNode !== state.captionsContainer) {
            node = node.parentNode;
          }

          if (!node) {
            // debug("could not find root for", mutation.target);
            continue;
          }

          updateCurrentTranscriptSession(node);
        }
      }
    }
  }, "executing observer")
);

// -------------------------------------------------------------------------
// Define MutationObserver to observe the caption container's style
// attribute
//
// NOTE: not a function
// -------------------------------------------------------------------------
const captionContainerAttributeObserver = new MutationObserver(
  tryTo((mutations) => {
    for (let mutation of mutations) {
      if (mutation.attributeName === "style") {
        const style = mutation.target.getAttribute("style");
        if (mutation.oldValue === "display: none;" && style === "") {
          // set this to null to force it to increment
          state.currentSessionIndex = null;
        }
      }
    }
  }, "executing observer")
);

// -------------------------------------------------------------------------
// Attach to captions container 1x
//
// Continually attempt to locate and observe the closed captions element.
// This needs to be re-run even after successfully attaching the user can
// disable and re-enable closed captioning.
// -------------------------------------------------------------------------
const closedCaptionsAttachLoop = () => {
  // TODO avoid re-attaching to the same container
  state.captionsContainer = findCaptionsContainer();

  debug("attached to closed captions");

  // In my experience, I haven't seen the captions container disappear but it could if
  // the user disables and re-enables captions again.
  if (state.captionsContainer) {
    clearInterval(state.closedCaptionsAttachInterval);
  }
};

////////////////////////////////////////////////////////////////////////////
// DOM Node Creation Utilities
////////////////////////////////////////////////////////////////////////////

const getTranscriptNameParts = (transcriptId) => {
  const name = get(`${makeTranscriptKey(transcriptId)}_name`);

  let ignore, path, year, month, day;

  try {
    [ignore, path, year, month, day] = transcriptId.match(
      /(.+)-([0-9]{4,4})-([0-9]{2,2})-([0-9]{2,2})/
    );
    month = parseInt(month, 10);
    day = parseInt(day, 10);
    year = parseInt(year, 10);
  } catch (e) {
    path = transcriptId;
    month = 4;
    day = 27;
    year = 2020;
  }

  return {
    name: name || path,
    year,
    month,
    day,
  };
};

////////////////////////////////////////////////////////////////////////////
// Main App
////////////////////////////////////////////////////////////////////////////

console.log(`[stenographer] init called`);

startTranscribing();
