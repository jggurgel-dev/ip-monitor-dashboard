let ipData = []; 
let currentPage = 1; 
const itemsPerPage = 12; 

const ipDescriptions = {
    "192.168.1.1": "SERVER 01",
    "192.168.1.2": "SERVER 02",
    "192.168.1.3": "SERVER 03",
    "192.168.1.4": "SERVER 04",
    
};

async function fetchIPStatus() {
    try {
        const response = await fetch('/api/ip-status');
        const data = await response.json();
        ipData = data.ipStatus;

        
        document.getElementById('online-count').textContent = data.totalOnline;
        document.getElementById('offline-count').textContent = data.totalOffline;

        
        renderIPGrid(ipData);
    } catch (error) {
        console.error('Erro ao buscar status dos IPs:', error);
    }
}

function renderIPGrid(data) {
    const grid = document.getElementById('ip-grid');
    grid.innerHTML = ''; 

    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedData = data.slice(start, end);

    paginatedData.forEach(({ ip, status }) => {
        const description = ipDescriptions[ip] || ip; 

        const card = document.createElement('div');
        card.className = `p-4 rounded-lg shadow-md text-center ${
            status === 'online' ? 'bg-teal-500' : 'bg-red-500'
        }`;
        card.innerHTML = `
            <p class="text-lg font-bold">${description}</p>
            <p class="text-sm">${ip}</p>
            <p class="text-sm">${status.toUpperCase()}</p>
        `;
        grid.appendChild(card);
    });
}

function filterIPs(filter) {
    let filteredData = ipData;

    if (filter === 'online') {
        filteredData = ipData.filter(ip => ip.status === 'online');
    } else if (filter === 'offline') {
        filteredData = ipData.filter(ip => ip.status === 'offline');
    }

    
    currentPage = 1;
    renderIPGrid(filteredData);
}

document.getElementById('filter-all').addEventListener('click', () => filterIPs('all'));
document.getElementById('filter-online').addEventListener('click', () => filterIPs('online'));
document.getElementById('filter-offline').addEventListener('click', () => filterIPs('offline'));

document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderIPGrid(ipData);
    }
});

document.getElementById('next-page').addEventListener('click', () => {
    const totalPages = Math.ceil(ipData.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        renderIPGrid(ipData);
    }
});

fetchIPStatus();