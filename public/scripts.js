const makeMeetListItem = (meet) => {

    let status = 'Waiting'
    if (meet.leftAt) {
        status = 'Finished'
    } else if (meet.joinedAt) {
        status = 'Ongoing'
    }

    const fgColors = {
        'Waiting': 'text-yellow-400',
        'Finished': 'text-red-800',
        'Ongoning': 'text-green-800',
    }

    const bgColors = {
        'Waiting': 'bg-yellow-100',
        'Finished': 'bg-red-100',
        'Ongoning': 'bg-green-100',
    }

	return `
<tr>
<td class="px-6 py-4 whitespace-nowrap">
  <div class="flex items-center">
    <div class="flex-shrink-0 h-10 w-10">
      <img class="h-10 w-10 rounded-full" src="logo.png" alt="">
    </div>
    <div class="ml-4">
      <div class="text-sm font-medium text-gray-900">
        ${meet.url.split("/").pop()}
      </div>
      <div class="text-xs text-gray-500">
        <a href=${meet.url}>${meet.url}</a>
      </div>
    </div>
  </div>
</td>
<td class="px-6 py-4 whitespace-nowrap text-sm">
  <a href=${
		meet.transcriptUrl
	} class="text-indigo-600 hover:text-indigo-900">Link</a>
</td>
<td class="px-6 py-4 whitespace-nowrap">
  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColors[status]} ${fgColors[status]}">
    ${status}
  </span>
</td>
<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
  ${meet.participants ? meet.participants : "N/A"}
</td>
<td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
  <a href="${meet.url}" class="text-indigo-600 hover:text-indigo-900">Join</a>
</td>
</tr>
`;
};

window.onload = function () {
	mockData = [
		{
			url: "https://meet.google.com/jtm-nzwu-amj",
			transcriptUrl:
				"https://docs.google.com/document/d/1K37L21w16d_0YQONESezFWfVHXEUy-eE8OYOlbps0mw/edit#",
			joinedAt: undefined,
			leftAt: "12213",
		},
		{
			url: "https://meet.google.com/jtm-nzwu-amj",
			transcriptUrl:
				"https://docs.google.com/document/d/1K37L21w16d_0YQONESezFWfVHXEUy-eE8OYOlbps0mw/edit#",
			joinedAt: undefined,
			leftAt: "12213",
		},
		{
			url: "https://meet.google.com/jtm-nzwu-amj",
			transcriptUrl:
				"https://docs.google.com/document/d/1K37L21w16d_0YQONESezFWfVHXEUy-eE8OYOlbps0mw/edit#",
			joinedAt: undefined,
			leftAt: "12213",
		},
	];

	$.get("/meets", function (data) {
		data.forEach((el) => {
			$("#meets-list").append(makeMeetListItem(el));
		});
        mockData.forEach((el) => {
			$("#meets-list").append(makeMeetListItem(el));
		});
	});
};
