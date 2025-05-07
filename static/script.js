function isValidSpeedInput(value) {
    const num = parseFloat(value);
    return !isNaN(num) && num > 0;
}

document.addEventListener('DOMContentLoaded', function () {

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
    
    function formatDurationHuman(seconds) {
        seconds = Math.floor(seconds);
        let h = Math.floor(seconds / 3600);
        let m = Math.floor((seconds % 3600) / 60);
        let s = seconds % 60;
    
        const parts = [];
        if (h > 0) parts.push(`${h} hour${h !== 1 ? 's' : ''}`);
        if (m > 0) parts.push(`${m} minute${m !== 1 ? 's' : ''}`);
        if (s > 0 || parts.length === 0) parts.push(`${s} second${s !== 1 ? 's' : ''}`);
        return parts.join(' ');
    }  


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
                <td><img src="${v.thumbnail_url}" alt="${v.thumbnail_url}" width="80" /></td>
                <td class="title-cell">${v.title}<br/>
                <span style= "font-size: 0.8em; color: #555;">${v.channel_title}</span></td> 
                <td>
                    <a href="${v.video_link}" target="_blank" style="text-decoration: none;" title = "Watch Video">
                    <img src="/static/Open_External.webp" alt="Open in new tab" width="20" height = "20" style="vertical-align: middle;"/>
                    </a>
                </td>
                <td>${formatDurationHuman(v.duration_seconds)}</td>
            </tr>
        `).join('');

        container.innerHTML = `
            <div class="table-wrapper">
                <table class = "fixed-header-table" >
                    <thead>
                        <tr>
                            <th><input type="checkbox" id="select-all-checkbox" title="Select/Deselect All" checked /></th>
                           // <th>S.no</th>
                            <th>Video</th>
                            <th></th>
                            <th>Link</th>
                            <th>Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>
            </div>
        `;

        // Add shadow to header only on scroll
        const wrapper = container.querySelector('.table-wrapper');
        const table = wrapper.querySelector('.fixed-header-table');

        wrapper.addEventListener('scroll', function () {
            if(wrapper.scrollTop > 0) {
                table.classList.add('fixed-header-shadow');
            } else {
                table.classList.remove('fixed-header-shadow');
            }
        });

        // Select/Deselect all checkboxes
        document.getElementById('select-all-checkbox').addEventListener('change', function (e) {
            const checkboxes = container.querySelectorAll('input[type="checkbox"][data-video-id]');
            checkboxes.forEach(cb => {
                cb.checked = e.target.checked;
            });
            calculateDuration();  // Recalculate when toggling all
        });
        
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
    
                let duration = result.duration_at_different_speeds[key];
                let h = 0, m = 0, s = 0;

                if (typeof duration === 'string') {
                    const timeParts = duration.split(':').map(Number);
                    if (timeParts.length === 3) {
                        [h, m, s] = timeParts;
                    } else if (timeParts.length === 2) {
                        [m, s] = timeParts;
                        h = 0;
                    } else if (timeParts.length === 1) {
                        s = timeParts[0];
                    }
                }

                // Build the human-readable string
                const parts = [];
                if (h === 0 && m === 0 && s === 0) {
                    parts.push("0 seconds");
                } else {
                    if (h) parts.push(`${h} hour${h !== 1 ? 's' : ''}`);
                    if (m) parts.push(`${m} minute${m !== 1 ? 's' : ''}`);
                    if (s) parts.push(`${s} second${s !== 1 ? 's' : ''}`);
                }

                const humanDuration = parts.join(' ');

                document.getElementById('output').innerHTML = `
                    Total playlist duration is <b> ${humanDuration} </b> at <b> ${key}x </b> speed
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
    
    function deselectRange(){
        const input = document.getElementById('rangeInput').value.trim();
        if(!input) return;  // No input, do nothing

        const indicesToDeselect = new Set();
        const tokens = input.split(',');

        for (let token of tokens){
            token = token.trim();
            if (/^\d+$/.test(token)){
                indicesToDeselect.add(parseInt(token));  
            } else if (/^\d+\s*-\s*\d+$/.test(token)){
                let [start, end] = token.split('-').map(n => parseInt(n.trim()));
                if (start > end) [start, end] = [end, start];  // Swap if start is greater than end
                for (let i = start; i <= end; i++){
                    indicesToDeselect.add(i);
                }
            }
        }

        const checkboxes = document.querySelectorAll('input[type="checkbox"][data-video-id]');
        indicesToDeselect.forEach(idx =>{
            const zeroBased = idx -1;
            if (checkboxes[zeroBased]){
                checkboxes[zeroBased].checked = false;  // Deselect the checkbox
            }
        })

        //  document.getElementById('rangeInput').value = '';  // Clear the input field
        calculateDuration();  // Recalculate after deselecting
    }

    document.getElementById('deselect-button').addEventListener('click', deselectRange); // Deselect button click event

});