const K = 10;
const grayIndexes = [2, 5, 8];

function generateHexPicks(containerId, prefix) {
    const container = document.getElementById(containerId);

    for (let i = 1; i <= K; i++) {
        const hex = document.createElement("div");
        hex.className = "hexagon";
        hex.textContent = `${prefix} ${i}`;
        hex.dataset.index = i;

        if (grayIndexes.includes(i)) {
            hex.classList.add("gray");
        }

        container.appendChild(hex);
    }
}

generateHexPicks("blue_picks", "Blue");
generateHexPicks("red_picks", "Red");
