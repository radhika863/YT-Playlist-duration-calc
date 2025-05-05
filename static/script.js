document.addEventListener('DOMContentLoaded', function () {

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

        document.getElementById('output').innerHTML = '';
        renderTable(data.videos);
    });


    document.getElementById('calculate-button').addEventListener('click', async () => {
        const checkboxes = document.querySelectorAll('input[type="checkbox"][data-video-id]');
        const selectedVideoIds = [];
        const durations = {};

        checkboxes.forEach(cb => {
            if (cb.checked) {
                const videoId = cb.dataset.videoId;
                selectedVideoIds.push(videoId);
                durations[videoId] = parseFloat(cb.dataset.duration);
            }
    });


    const playbackSpeed = parseFloat(document.getElementById('speed-input').value) || null;

    const response = await fetch ('/calculate_selected', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            video_ids: selectedVideoIds,
            durations: durations,
            playback_speed: playbackSpeed
            
        })
    });
    
    try {
        const result = await response.json();

        if (response.ok) {
            const speed = playbackSpeed || 1.0;
            const allKeys = Object.keys(result.duration_at_different_speeds);
            const key = allKeys.find(k => parseFloat(k) === parseFloat(speed));
            const duration = result.duration_at_different_speeds[key];
        
            document.getElementById('output').innerHTML = `
                <b>Total playlist duration:</b> ${duration} at ${key}x speed
            `;
        } else {
            alert(result.error || 'Error in calculating duration');
        }
    } catch (err) {
        const text = await response.text();
    console.error('Non-JSON response:', text);
    alert('Unexpected error occurred. Check console for details.');
    }
    });


    function renderTable(videos){
        const container = document.getElementById('videoTableContainer');
        const rows = videos.map((v,i) =>`
            <tr>
                <td><input 
                    type ="checkbox" 
                    data-video-id="${v.id}" 
                    data-duration="${v.duration_seconds}" 
                    checked /></td>
                <td>${i+1}</td>
                <td><img src="${v.thumbnail_url}" alt="${v.thumbnail_url}" width="100" /></td>
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
                        <th>Thumbnail</th>
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

});