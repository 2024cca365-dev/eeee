document.addEventListener('DOMContentLoaded', () => {
    // Theme Switch Logic
    const themeToggle = document.getElementById('theme-toggle');
    const docElement = document.documentElement;

    // Function to apply a theme
    const applyTheme = (theme) => {
        docElement.setAttribute('data-theme', theme);
        localStorage.setItem('lotto_theme', theme);
        if (themeToggle) {
            themeToggle.checked = theme === 'dark';
        }
    };

    // Function to toggle between light and dark
    const toggleTheme = () => {
        const currentTheme = localStorage.getItem('lotto_theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    };

    // Check for saved theme in localStorage or system preference
    const savedTheme = localStorage.getItem('lotto_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme) {
        applyTheme(savedTheme);
    } else if (prefersDark) {
        applyTheme('dark');
    } else {
        applyTheme('light');
    }

    if (themeToggle) {
        themeToggle.addEventListener('change', toggleTheme);
    }

    // Lotto Generator Logic (Only run if elements exist)
    const numbersContainer = document.getElementById('lotto-numbers');
    const generateBtn = document.getElementById('generate-btn');

    if (generateBtn && numbersContainer) {
        const generateLottoNumbers = () => {
            // Clear previous numbers with a fade-out effect
            Array.from(numbersContainer.children).forEach((child, index) => {
                setTimeout(() => {
                    child.style.transform = 'scale(0)';
                }, index * 50);
            });

            setTimeout(() => {
                numbersContainer.innerHTML = '';

                const numbers = new Set();
                while (numbers.size < 6) {
                    const randomNumber = Math.floor(Math.random() * 45) + 1;
                    numbers.add(randomNumber);
                }

                const sortedNumbers = Array.from(numbers).sort((a, b) => a - b);

                sortedNumbers.forEach((number, index) => {
                    const numberDiv = document.createElement('div');
                    numberDiv.classList.add('number');
                    numberDiv.textContent = number;
                    
                    // Assign color based on number range
                    let color;
                    if (number <= 10) {
                        color = '#fbc400'; // Yellow
                    } else if (number <= 20) {
                        color = '#69c8f2'; // Blue
                    } else if (number <= 30) {
                        color = '#ff7272'; // Red
                    } else if (number <= 40) {
                        color = '#aaa'; // Gray/Black
                    } else {
                        color = '#b0d840'; // Green
                    }
                    numberDiv.style.backgroundColor = color;
                    
                    // Staggered appearance animation
                    numberDiv.style.transform = 'scale(0)';
                    numbersContainer.appendChild(numberDiv);
                    setTimeout(() => {
                        numberDiv.style.transform = 'scale(1)';
                    }, index * 100);
                });
            }, 400); // Wait for fade-out to complete
        };

        generateBtn.addEventListener('click', generateLottoNumbers);
        // Generate initial set of numbers on page load
        generateLottoNumbers();
    }

    // Fortune Generator Logic (Only run if elements exist)
    const fortuneBtn = document.getElementById('fortune-btn');
    const fortuneText = document.getElementById('fortune-text');

    if (fortuneBtn && fortuneText) {
        const fortunes = [
            "오늘은 새로운 시작에 완벽한 날입니다. 용기를 내세요.",
            "작은 변화가 큰 행운을 불러옵니다. 주변을 둘러보세요.",
            "예상치 못한 곳에서 좋은 소식이 들려올 것입니다.",
            "꾸준함이 결실을 맺는 날입니다. 하던 일을 계속 밀고 나가세요.",
            "휴식이 필요한 시점입니다. 잠시 멈춰도 괜찮습니다.",
            "귀인이 나타나 도움을 줄 것입니다. 열린 마음을 유지하세요.",
            "금전운이 상승하는 날입니다. 작은 투자를 고려해보세요.",
            "오랜 친구와의 만남이 에너지를 불어넣어 줄 것입니다.",
            "새로운 것을 배우기에 좋은 날입니다. 도전해보세요.",
            "긍정적인 생각이 좋은 결과를 가져옵니다. 웃음을 잃지 마세요."
        ];

        const drawFortune = () => {
            fortuneText.style.opacity = 0; // Fade out

            setTimeout(() => {
                const randomIndex = Math.floor(Math.random() * fortunes.length);
                fortuneText.textContent = fortunes[randomIndex];
                fortuneText.style.opacity = 1; // Fade in
            }, 300);
        };

        fortuneBtn.addEventListener('click', drawFortune);
        
        // Set initial text style
        fortuneText.style.transition = 'opacity 0.3s ease-in-out';
    }

    // Stats Page Logic (Only run if elements exist)
    const numberSelector = document.getElementById('number-selector');
    const runSimulationBtn = document.getElementById('run-simulation-btn');
    const simulationResultDiv = document.getElementById('simulation-result');
    const leaderboardBody = document.getElementById('leaderboard-body');

    if (numberSelector && runSimulationBtn && simulationResultDiv && leaderboardBody) {
        let selectedNumbers = [];

        // --- Number Selector Generation ---
        const generateNumberSelector = () => {
            for (let i = 1; i <= 45; i++) {
                const numberCircle = document.createElement('div');
                numberCircle.classList.add('number-circle');
                numberCircle.textContent = i;
                numberCircle.dataset.number = i;
                numberSelector.appendChild(numberCircle);

                numberCircle.addEventListener('click', () => {
                    const num = parseInt(numberCircle.dataset.number);
                    if (numberCircle.classList.contains('selected')) {
                        numberCircle.classList.remove('selected');
                        selectedNumbers = selectedNumbers.filter(n => n !== num);
                    } else {
                        if (selectedNumbers.length < 6) {
                            numberCircle.classList.add('selected');
                            selectedNumbers.push(num);
                        } else {
                            alert('6개의 번호만 선택할 수 있습니다.');
                        }
                    }
                    updateSimulationButtonState();
                });
            }
        };

        // --- Update Simulation Button State ---
        const updateSimulationButtonState = () => {
            if (selectedNumbers.length === 6) {
                runSimulationBtn.disabled = false;
                runSimulationBtn.textContent = '결과 확인';
            } else {
                runSimulationBtn.disabled = true;
                runSimulationBtn.textContent = `번호를 ${6 - selectedNumbers.length}개 더 선택하세요`;
            }
        };

        // --- Lotto Simulation Logic ---
        const generateRandomLottoNumbers = () => {
            const numbers = new Set();
            while (numbers.size < 6) {
                numbers.add(Math.floor(Math.random() * 45) + 1);
            }
            return Array.from(numbers).sort((a, b) => a - b);
        };

        const compareLottoNumbers = (myNumbers, winningNumbers) => {
            const matches = myNumbers.filter(num => winningNumbers.includes(num));
            return matches;
        };

        const displaySimulationResult = (myNumbers, winningNumbers, matchedNumbers) => {
            simulationResultDiv.innerHTML = `
                <p><strong>내가 선택한 번호:</strong></p>
                <div class="result-numbers-display">
                    ${myNumbers.map(num => `<div class="result-number ${matchedNumbers.includes(num) ? 'matched' : ''}">${num}</div>`).join('')}
                </div>
                <p><strong>이번 회차 당첨 번호:</strong></p>
                <div class="result-numbers-display">
                    ${winningNumbers.map(num => `<div class="result-number ${matchedNumbers.includes(num) ? 'matched' : ''}">${num}</div>`).join('')}
                </div>
                <p><strong>총 ${matchedNumbers.length}개 일치!</strong></p>
            `;
        };

        runSimulationBtn.addEventListener('click', () => {
            if (selectedNumbers.length === 6) {
                const winningNumbers = generateRandomLottoNumbers();
                const matchedNumbers = compareLottoNumbers(selectedNumbers, winningNumbers);
                displaySimulationResult(selectedNumbers, winningNumbers, matchedNumbers);
            }
        });

        // --- Leaderboard Logic (Sample Data) ---
        const populateLeaderboard = () => {
            // Sample data - in a real application, this would come from an API or database
            const sampleFrequencies = {
                1: 15, 2: 12, 3: 18, 4: 10, 5: 20, 6: 14, 7: 17, 8: 11, 9: 19, 10: 13,
                11: 22, 12: 16, 13: 21, 14: 9, 15: 25, 16: 8, 17: 23, 18: 7, 19: 24, 20: 6,
                21: 26, 22: 5, 23: 27, 24: 4, 25: 28, 26: 3, 27: 29, 28: 2, 29: 30, 30: 1,
                31: 32, 32: 31, 33: 34, 34: 33, 35: 36, 36: 35, 37: 38, 38: 37, 39: 40, 40: 39,
                41: 42, 42: 41, 43: 44, 44: 43, 45: 45
            };

            const sortedFrequencies = Object.entries(sampleFrequencies)
                .sort(([, freqA], [, freqB]) => freqB - freqA); // Sort by frequency descending

            leaderboardBody.innerHTML = ''; // Clear existing content

            sortedFrequencies.forEach(([number, count], index) => {
                const row = leaderboardBody.insertRow();
                row.insertCell(0).textContent = index + 1;
                row.insertCell(1).textContent = number;
                row.insertCell(2).textContent = count;
            });
        };
        
        // Initialize functions
        generateNumberSelector();
        updateSimulationButtonState();
        populateLeaderboard();
    }
});