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

    // Lotto Generator Logic
    const numbersContainer = document.getElementById('lotto-numbers');
    const generateBtn = document.getElementById('generate-btn');

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

    if (generateBtn) {
        generateBtn.addEventListener('click', generateLottoNumbers);
        // Generate initial set of numbers on page load
        generateLottoNumbers();
    }
});