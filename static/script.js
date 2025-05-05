document.getElementById('fetchForm').addEventListener('submit', async function (e){
    e.preventDefault();

    const url = document.getElementById('playlistUrl').value;
    const res = await fetch('/fetch_videos',{
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({playlist_url: url})
    });

    const data = await res.json();
    console.log(data);
    if(!res.ok){
        alert(data.error || 'Error in fetching videos');
        return;
    }

    renderTable(data.videos);
});

function renderTable(videos){
    const container = document.getElementById('videoTableContainer');
    const rows = videos.map((v,i) =>`
        <tr>
            <td><input type ="checkbox" data-id="${v.id}" checked /></td>
            <td>${i+1}</td>
            <td><a href="${v.video_link}" target="_blank">${v.title}</a></td>
            <td>${v.formatted_duration}</td>
        </tr>
    `).join('');

    container.innerHTML = `
        <table border ="1" cellpadding="5" cellspacing="0">
            <thead>
                <tr>
                    <th>Select</th>
                    <th>S.no</th>
                    <th>Title</th>
                    <th>Duration</th>
                </tr>
            </thead>
            <tbody>
                ${rows}
            </tbody>
        </table>
    `;
}