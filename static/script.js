function isValidSpeedInput(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
}


document.addEventListener('DOMContentLoaded', function () {
/*
    document.getElementById('fetchForm').addEventListener('submit', async function (e){
        e.preventDefault();

        const url = document.getElementById('playlistUrl').value;

        const speed = document.getElementById('speed-input').value.trim();
        if (!isValidSpeedInput(speed)) {
            alert('Please enter a speed greater than 0.');
            return;
        }



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
    */

    document.getElementById('fetchForm').addEventListener('submit', async function (e){
        e.preventDefault();
    
        const url = document.getElementById('playlistUrl').value;
    
        const speed = document.getElementById('speed-input').value.trim();
        if (!isValidSpeedInput(speed)) {
            alert('Please enter a speed greater than 0.');
            return;
        }
    
        const res = await fetch('/fetch_videos', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({playlist_url: url})
        });
    
        const data = await res.json();
        console.log(data);
        if (!res.ok){
            alert(data.error || 'Error in fetching videos');
            return;
        }
    
        // Render table and immediately calculate
        document.getElementById('output').innerHTML = '';
        renderTable(data.videos);
        await calculateDuration();  // auto calculate after render
    });
    

/*
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


    const rawSpeed = document.getElementById('speed-input').value.trim();
    if (!isValidSpeedInput(rawSpeed)) {
        alert('Speed must be a number greater than 0.');
        return;
    }
    const playbackSpeed = parseFloat(rawSpeed);


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
*/

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
        // Recalculate when checkboxes change
        const checkboxes = container.querySelectorAll('input[type="checkbox"][data-video-id]');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', calculateDuration);
        });

    }

    async function calculateDuration() {
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
    
        const rawSpeed = document.getElementById('speed-input').value.trim();
        if (!isValidSpeedInput(rawSpeed)) {
            alert('Speed must be a number greater than 0.');
            return;
        }
        const playbackSpeed = parseFloat(rawSpeed);
    
        const response = await fetch('/calculate_selected', {
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
                let key = allKeys.find(k => parseFloat(k) === parseFloat(speed));
    
                if (!key) {
                    let closest = allKeys.map(k => parseFloat(k))
                                         .reduce((prev, curr) => Math.abs(curr - speed) < Math.abs(prev - speed) ? curr : prev);
                    key = String(closest);
                    alert(`Exact speed not available. Showing closest match: ${key}x`);
                }
    
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
    }
    

});