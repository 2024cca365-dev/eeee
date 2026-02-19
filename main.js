document.addEventListener('DOMContentLoaded', () => {
    // --- Firebase Setup (IMPORTANT!) ---
    // 1. Create a project on https://firebase.google.com/
    // 2. Go to Project settings > General, and "Add Firebase to your web app".
    // 3. Copy the firebaseConfig object here.
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_PROJECT_ID.appspot.com",
        messagingSenderId: "YOUR_SENDER_ID",
        appId: "YOUR_APP_ID"
    };

    let db;
    try {
        if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
            firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
            console.log("Firebase initialized successfully.");
        } else {
            console.warn("Firebase is not configured. Please fill in firebaseConfig in main.js to enable saving/loading numbers.");
        }
    } catch (e) {
        console.error("Could not initialize Firebase. Check your config.", e);
    }

    // Theme Switch Logic
    const themeToggle = document.getElementById('theme-toggle');
    const docElement = document.documentElement;
    const applyTheme = (theme) => {
        docElement.setAttribute('data-theme', theme);
        localStorage.setItem('lotto_theme', theme);
        if (themeToggle) themeToggle.checked = theme === 'dark';
    };
    const toggleTheme = () => {
        const currentTheme = localStorage.getItem('lotto_theme') || 'light';
        applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
    };
    const savedTheme = localStorage.getItem('lotto_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedTheme) applyTheme(savedTheme);
    else if (prefersDark) applyTheme('dark');
    else applyTheme('light');
    if (themeToggle) themeToggle.addEventListener('change', toggleTheme);

    // Lotto Generator Logic
    const numbersContainer = document.getElementById('lotto-numbers');
    const generateBtn = document.getElementById('generate-btn');
    if (generateBtn && numbersContainer) {
        const generateLottoNumbers = () => {
            Array.from(numbersContainer.children).forEach((child, index) => {
                setTimeout(() => { child.style.transform = 'scale(0)'; }, index * 50);
            });
            setTimeout(() => {
                numbersContainer.innerHTML = '';
                const numbers = new Set();
                while (numbers.size < 6) {
                    numbers.add(Math.floor(Math.random() * 45) + 1);
                }
                const sortedNumbers = Array.from(numbers).sort((a, b) => a - b);
                sortedNumbers.forEach((number, index) => {
                    const numberDiv = document.createElement('div');
                    numberDiv.classList.add('number');
                    numberDiv.textContent = number;
                    let color;
                    if (number <= 10) color = '#fbc400';
                    else if (number <= 20) color = '#69c8f2';
                    else if (number <= 30) color = '#ff7272';
                    else if (number <= 40) color = '#aaa';
                    else color = '#b0d840';
                    numberDiv.style.backgroundColor = color;
                    numberDiv.style.transform = 'scale(0)';
                    numbersContainer.appendChild(numberDiv);
                    setTimeout(() => { numberDiv.style.transform = 'scale(1)'; }, index * 100);
                });
            }, 400);
        };
        generateBtn.addEventListener('click', generateLottoNumbers);
        generateLottoNumbers();
    }

    // --- AI & Firebase Features Logic ---
    const dreamInput = document.getElementById('dream-input');
    const dreamBtn = document.getElementById('dream-btn');
    const strategyBtn = document.getElementById('strategy-btn');
    const loading = document.getElementById('loading');
    const dreamResultContainer = document.getElementById('dream-result-container');
    const dreamResult = document.getElementById('dream-result');
    const dreamExplanation = document.getElementById('dream-explanation');
    const loadSavedBtn = document.getElementById('load-saved-btn');
    const savedNumbersList = document.getElementById('saved-numbers-list');

    if (dreamBtn && strategyBtn && loadSavedBtn) {
        const RECENT_WINNING_NUMBERS = [
            { round: 1105, numbers: [6, 16, 34, 37, 39, 40] },
            { round: 1104, numbers: [1, 9, 12, 28, 38, 44] },
            { round: 1103, numbers: [3, 4, 9, 30, 33, 36] },
            { round: 1102, numbers: [14, 20, 26, 31, 35, 45] },
            { round: 1101, numbers: [5, 11, 15, 23, 33, 41] },
        ];

        const saveLottoResult = (numbers, explanation) => {
            if (!db) {
                console.log("Firebase not configured. Skipping save.");
                return;
            }
            db.collection("savedNumbers").add({
                numbers: numbers,
                explanation: explanation,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then((docRef) => {
                console.log("Document written with ID: ", docRef.id);
            })
            .catch((error) => {
                console.error("Error adding document: ", error);
            });
        };

        const displayAIResult = (result) => {
            dreamResult.innerHTML = '';
            if (!result || !result.numbers || !result.explanation) {
                console.error("Invalid AI response format:", result);
                dreamExplanation.textContent = 'AI 응답 형식이 올바르지 않습니다. 다시 시도해 주세요.';
                dreamResultContainer.style.display = 'block';
                return;
            }
            const sortedNumbers = result.numbers.sort((a, b) => a - b);
            sortedNumbers.forEach((number, index) => {
                const numberDiv = document.createElement('div');
                numberDiv.classList.add('number');
                numberDiv.textContent = number;
                let color;
                if (number <= 10) color = '#fbc400';
                else if (number <= 20) color = '#69c8f2';
                else if (number <= 30) color = '#ff7272';
                else if (number <= 40) color = '#aaa';
                else color = '#b0d840';
                numberDiv.style.backgroundColor = color;
                numberDiv.style.transform = 'scale(0)';
                dreamResult.appendChild(numberDiv);
                setTimeout(() => { numberDiv.style.transform = 'scale(1)'; }, index * 100);
            });
            dreamExplanation.textContent = result.explanation;
            dreamResultContainer.style.display = 'block';

            // Save the result to Firestore
            saveLottoResult(sortedNumbers, result.explanation);
        };

        const callOpenAI = async (prompt) => {
            loading.style.display = 'block';
            dreamResultContainer.style.display = 'none';
            dreamBtn.disabled = true;
            strategyBtn.disabled = true;

            const apiKey = 'YOUR_OPENAI_API_KEY';
            if (apiKey === 'YOUR_OPENAI_API_KEY') {
                alert('OpenAI API 키를 main.js 파일에 입력해주세요!');
                loading.style.display = 'none';
                dreamBtn.disabled = false;
                strategyBtn.disabled = false;
                return;
            }

            const apiUrl = 'https://api.openai.com/v1/chat/completions';
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${apiKey}\` },
                    body: JSON.stringify({
                        model: 'gpt-3.5-turbo-0125',
                        messages: [{ role: 'user', content: prompt }],
                        response_format: { type: "json_object" }
                    })
                });
                if (!response.ok) throw new Error(\`OpenAI API error: \${response.statusText}\`);
                const data = await response.json();
                const aiResponse = JSON.parse(data.choices[0].message.content);
                displayAIResult(aiResponse);
            } catch (error) {
                console.error('Error fetching from OpenAI:', error);
                dreamExplanation.textContent = 'AI 분석 중 오류가 발생했습니다. API 키를 확인하거나 잠시 후 다시 시도해주세요.';
                dreamResult.innerHTML = '';
                dreamResultContainer.style.display = 'block';
            } finally {
                loading.style.display = 'none';
                dreamBtn.disabled = false;
                strategyBtn.disabled = false;
            }
        };

        dreamBtn.addEventListener('click', () => {
            const dreamText = dreamInput.value;
            if (!dreamText.trim()) {
                alert('꿈 내용을 입력해주세요.');
                return;
            }
            const dreamPrompt = \`사용자가 입력한 다음 꿈 내용을 분석해서, 한국의 로또 6/45 형식에 맞는 행운의 숫자 6개를 추천해줘. 숫자는 1부터 45 사이의 정수여야 하고, 서로 중복되면 안 돼. 꿈 내용과 숫자를 연관지어 흥미로운 해설을 1~2문장으로 덧붙여줘. 입력된 꿈 내용: "\${dreamText}" 결과는 반드시 다음 JSON 형식에 맞춰서 반환해줘. 다른 말은 절대 추가하지 마. { "numbers": [1, 2, 3, 4, 5, 6], "explanation": "해설입니다." }\`;
            callOpenAI(dreamPrompt);
        });

        strategyBtn.addEventListener('click', () => {
            const dataContext = JSON.stringify(RECENT_WINNING_NUMBERS);
            const strategyPrompt = \`너는 로또 번호 분석 전문가야. 다음 최신 당첨 번호 데이터를 바탕으로 전략적인 로또 번호 6개를 추천해줘. 최신 당첨 번호 데이터 (최신순): \${dataContext}. 분석 시, 1. 미출현 번호, 2. 홀짝 비율, 3. 연속 번호 포함 여부를 고려해줘. 결과적으로 추천하는 6개의 번호와 그 이유를 흥미롭게 설명해줘. 숫자는 1부터 45 사이의 정수여야 하고, 서로 중복되면 안 돼. 결과는 반드시 다음 JSON 형식에 맞춰서 반환해줘. 다른 말은 절대 추가하지 마. { "numbers": [7, 13, 19, 21, 35, 42], "explanation": "분석 결과입니다." }\`;
            callOpenAI(strategyPrompt);
        });

        loadSavedBtn.addEventListener('click', async () => {
            if (!db) {
                alert("Firebase가 설정되지 않았습니다. main.js 파일에서 firebaseConfig를 확인해주세요.");
                return;
            }
            savedNumbersList.innerHTML = '<div class="spinner"></div>';
            try {
                const snapshot = await db.collection("savedNumbers").orderBy("createdAt", "desc").limit(10).get();
                if (snapshot.empty) {
                    savedNumbersList.innerHTML = '<p>저장된 번호가 없습니다.</p>';
                    return;
                }
                savedNumbersList.innerHTML = '';
                snapshot.forEach(doc => {
                    const item = doc.data();
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'saved-item';
                    
                    const numbersHTML = item.numbers.map(number => {
                        let color;
                        if (number <= 10) color = '#fbc400';
                        else if (number <= 20) color = '#69c8f2';
                        else if (number <= 30) color = '#ff7272';
                        else if (number <= 40) color = '#aaa';
                        else color = '#b0d840';
                        return \`<div class="number" style="background-color: \${color}; transform: scale(0.8);">${number}</div>\`;
                    }).join('');

                    itemDiv.innerHTML = \`
                        <div class="lotto-numbers">\${numbersHTML}</div>
                        <p>\${item.explanation}</p>
                    \`;
                    savedNumbersList.appendChild(itemDiv);
                });
            } catch (error) {
                console.error("Error loading saved numbers: ", error);
                savedNumbersList.innerHTML = '<p>번호를 불러오는 중 오류가 발생했습니다.</p>';
            }
        });
    }
});