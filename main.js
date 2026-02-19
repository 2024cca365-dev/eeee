document.addEventListener('DOMContentLoaded', () => {
    // --- Firebase Setup (IMPORTANT!) ---
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
            console.warn("Firebase is not configured. Please fill in firebaseConfig in main.js.");
        }
    } catch (e) {
        console.error("Could not initialize Firebase. Check your config.", e);
    }

    // --- Helper function for number colors ---
    const getLottoNumberColor = (number) => {
        if (number <= 10) return '#fbc400';
        if (number <= 20) return '#69c8f2';
        if (number <= 30) return '#ff7272';
        if (number <= 40) return '#aaa';
        return '#b0d840';
    };

    const saveLottoResult = (numbers, explanation) => {
        if (!db) { console.log("Firebase not configured. Skipping save."); return; }
        db.collection("savedNumbers").add({
            numbers: numbers,
            explanation: explanation,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(docRef => console.log("Result saved with ID: ", docRef.id))
          .catch(error => console.error("Error saving result: ", error));
    };

    // --- General Elements & Theme Logic ---
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

    const loading = document.getElementById('loading');

    // --- Generic AI Calling Function ---
    const callAI = async (prompt, displayCallback) => {
        loading.style.display = 'block';
        document.querySelectorAll('button').forEach(btn => btn.disabled = true);

        const apiKey = 'YOUR_OPENAI_API_KEY'; // IMPORTANT: User must replace this
        if (apiKey === 'YOUR_OPENAI_API_KEY') {
            alert('OpenAI API 키를 main.js 파일에 입력해주세요! API 키가 없으면 AI 기능을 사용할 수 없습니다.');
            loading.style.display = 'none';
            document.querySelectorAll('button').forEach(btn => btn.disabled = false);
            return;
        }

        const apiUrl = 'https://api.openai.com/v1/chat/completions';
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
                body: JSON.stringify({
                    model: 'gpt-3.5-turbo-0125',
                    messages: [
                        { role: 'system', content: '너는 로또 해몽 및 분석 전문가야. 결과는 반드시 numbers와 explanation을 포함한 JSON으로 답해줘.' },
                        { role: 'user', content: prompt }
                    ],
                    response_format: { type: "json_object" }
                })
            });
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorBody}`);
            }
            const data = await response.json();
            console.log("OpenAI API Response:", data); // Log the full response for debugging
            if (!data.choices || data.choices.length === 0 || !data.choices[0].message.content) {
                throw new Error("Invalid response structure from OpenAI API.");
            }
            const aiResponse = JSON.parse(data.choices[0].message.content);
            displayCallback(aiResponse);
        } catch (error) {
            console.error('Error fetching from OpenAI:', error);
            alert('AI 분석 중 오류가 발생했습니다. API 키를 확인하거나 잠시 후 다시 시도해주세요.');
        } finally {
            loading.style.display = 'none';
            document.querySelectorAll('button').forEach(btn => btn.disabled = false);
        }
    };
    
    // --- AI Number Generation Features ---
    const dreamInput = document.getElementById('dream-input');
    const dreamBtn = document.getElementById('dream-btn');
    const strategyBtn = document.getElementById('strategy-btn');
    const dreamResultContainer = document.getElementById('dream-result-container');
    const dreamResult = document.getElementById('dream-result');
    const dreamExplanation = document.getElementById('dream-explanation');

    if (dreamBtn && strategyBtn) {
        const RECENT_WINNING_NUMBERS = [
            { round: 1105, numbers: [6, 16, 34, 37, 39, 40] },
            { round: 1104, numbers: [1, 9, 12, 28, 38, 44] },
            { round: 1103, numbers: [3, 4, 9, 30, 33, 36] },
        ];

        const displayDreamResult = (result) => {
            dreamResultContainer.style.display = 'block';
            dreamResult.innerHTML = '';

            if (!result || !result.numbers || !result.explanation) {
                dreamExplanation.textContent = 'AI 응답 형식이 올바르지 않습니다.';
                return;
            }

            const sortedNumbers = [...result.numbers].sort((a, b) => a - b);
            
            const numbersHtml = sortedNumbers.map(number => {
                const color = getLottoNumberColor(number);
                return `<div class="number" style="background-color: ${color}; color: white; font-weight: bold; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 5px;">${number}</div>`;
            }).join('');

            dreamResult.innerHTML = `<div style="display: flex; flex-wrap: wrap; justify-content: center;">${numbersHtml}</div>`;
            dreamExplanation.textContent = result.explanation;
            saveLottoResult(sortedNumbers, result.explanation);
        };
        
        dreamBtn.addEventListener('click', () => {
            const dreamText = dreamInput.value;
            if (!dreamText.trim()) { alert('꿈 내용을 입력해주세요.'); return; }
            const dreamPrompt = \`사용자가 입력한 다음 꿈 내용을 분석해서, 한국의 로또 6/45 형식에 맞는 행운의 숫자 6개를 추천하고, 꿈과 숫자를 연관지어 흥미로운 해설을 1~2문장으로 덧붙여줘. 입력된 꿈: \"\${dreamText}\". 반드시 다음 JSON 형식으로 반환해줘: { "numbers": [n1, n2, n3, n4, n5, n6], "explanation": "해설" }\`;
            callAI(dreamPrompt, displayDreamResult);
        });

        strategyBtn.addEventListener('click', () => {
            const dataContext = JSON.stringify(RECENT_WINNING_NUMBERS);
            const strategyPrompt = \`너는 로또 번호 분석 전문가야. 다음 최신 당첨 번호 데이터 \${dataContext}를 바탕으로, 미출현 번호, 홀짝 비율, 연속 번호 등을 고려해서 전략적인 로또 번호 6개를 추천하고, 그 이유를 흥미롭게 설명해줘. 반드시 다음 JSON 형식으로 반환해줘: { "numbers": [n1, n2, n3, n4, n5, n6], "explanation": "분석 결과" }\`;
            callAI(strategyPrompt, displayDreamResult);
        });
    }

    // --- AI Weekly Report Feature ---
    const reportBtn = document.getElementById('report-btn');
    const reportResultContainer = document.getElementById('report-result-container');

    if(reportBtn) {
        const displayReportResult = (result) => {
            reportResultContainer.style.display = 'block';
            if (!result || !result.luck_score || !result.message || !result.numbers || !result.explanation) {
                reportResultContainer.innerHTML = '<p>AI 리포트 생성에 실패했습니다. 응답 형식을 확인해주세요.</p>';
                return;
            }
            const sortedNumbers = [...result.numbers].sort((a, b) => a - b);
            const numbersHTML = sortedNumbers.map(number => {
                const color = getLottoNumberColor(number);
                return `<div class="number" style="background-color: ${color}; color: white; font-weight: bold; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 5px;">${number}</div>`;
            }).join('');

            reportResultContainer.innerHTML = \`
                <h3>이번 주 행운 리포트</h3>
                <p><strong>행운 수치:</strong> \${result.luck_score}점 / 100점</p>
                <p><strong>AI 행운 메시지:</strong> \${result.message}</p>
                <p><strong>추천 번호 조합:</strong></p>
                <div class="lotto-numbers" style="display: flex; flex-wrap: wrap; justify-content: center;">\${numbersHTML}</div>
                <p><strong>조합 분석:</strong> \${result.explanation}</p>
            \`;
            saveLottoResult(sortedNumbers, \`[주간 리포트] \${result.explanation}\`);
        };

        reportBtn.addEventListener('click', () => {
            const today = new Date();
            const reportPrompt = \`오늘은 \${today.toLocaleDateString('ko-KR')}입니다. 사용자를 위한 주간 로또 행운 리포트를 생성해줘. 다음 JSON 형식을 반드시 지켜서 응답해줘. 다른 말은 절대 추가하지 마: { "luck_score": 1부터 100 사이의 행운 점수(정수), "message": "이번 주를 위한 긍정적이고 희망찬 행운 메시지(1~2문장)", "numbers": [1부터 45까지의 서로 다른 숫자 6개], "explanation": "이 숫자 조합을 추천하는 흥미로운 이유(1~2문장)" }\`;
            callAI(reportPrompt, displayReportResult);
        });
    }

    // --- Firebase Save/Load Logic ---
    const loadSavedBtn = document.getElementById('load-saved-btn');
    const savedNumbersList = document.getElementById('saved-numbers-list');

    if (loadSavedBtn) {
        loadSavedBtn.addEventListener('click', async () => {
            if (!db) { alert("Firebase가 설정되지 않았습니다. main.js 파일에서 firebaseConfig를 확인해주세요."); return; }
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
                        const color = getLottoNumberColor(number);
                        return `<div class="number" style="background-color: \${color}; color: white; font-weight: bold; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 3px; font-size: 0.8rem;">\${number}</div>`;
                    }).join('');
                    itemDiv.innerHTML = \`<div class="lotto-numbers" style="display: flex; flex-wrap: wrap; justify-content: center;">\${numbersHTML}</div><p>\${item.explanation}</p>\`;
                    savedNumbersList.appendChild(itemDiv);
                });
            } catch (error) {
                console.error("Error loading saved numbers: ", error);
                savedNumbersList.innerHTML = '<p>번호를 불러오는 중 오류가 발생했습니다.</p>';
            }
        });
    }
});