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
        const generateRandomNumbers = () => {
            const numbers = [];
            while (numbers.length < 6) {
                const n = Math.floor(Math.random() * 45) + 1;
                if (!numbers.includes(n)) numbers.push(n);
            }
            return numbers.sort((a, b) => a - b);
        };

        const displayDreamResult = (result) => {
            dreamResultContainer.style.display = 'block';
            dreamResult.innerHTML = '';

            if (!result || !result.numbers || !result.explanation) {
                dreamExplanation.textContent = '결과를 생성하는 중 오류가 발생했습니다.';
                return;
            }

            const sortedNumbers = [...result.numbers].sort((a, b) => a - b);
            
            const numbersHtml = sortedNumbers.map(number => {
                const color = getLottoNumberColor(number);
                return `<div class="number" style="background-color: ${color}; color: white; font-weight: bold; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 5px;">${number}</div>`;
            }).join('');

            dreamResult.innerHTML = `<div style="display: flex; flex-wrap: wrap; justify-content: center;">${numbersHtml}</div>`;
            // Convert markdown-like ** to <b> and handle newlines
            const formattedExplanation = result.explanation
                .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                .replace(/\n/g, '<br>');
            dreamExplanation.innerHTML = formattedExplanation;
            saveLottoResult(sortedNumbers, result.explanation);
        };
        
        dreamBtn.addEventListener('click', () => {
            const dreamText = dreamInput.value.trim();
            if (!dreamText || dreamText.length <= 10) {
                alert('꿈 내용을 10글자 이상 더 자세히 써주세요!');
                return;
            }
            const randomNumbers = generateRandomNumbers();
            displayDreamResult({
                numbers: randomNumbers,
                explanation: '꿈 해몽 결과로 생성된 랜덤 행운 번호입니다.'
            });
        });

        strategyBtn.addEventListener('click', () => {
            const dreamText = dreamInput.value.trim();
            if (!dreamText || dreamText.length <= 5) {
                alert('내용을 5글자 이상 더 추가해주세요!');
                return;
            }
            const pigDreamText = `챗지피티의 답변
돼지꿈을 꾸셨군요! 예로부터 돼지는 다산과 풍요를 상징해서 **'로또 당첨 꿈'**의 대명사로 불리죠.

재미 삼아 보는 것이지만, 꿈의 구체적인 상황과 역대 당첨 데이터의 패턴(자주 등장하는 번호대, 미출현 번호 등)을 결합하여 AI 데이터 분석 기반의 추천 번호를 생성해 드립니다.

🐷 돼지꿈 상황별 번호 가중치
꿈의 내용에 따라 번호의 기운이 조금씩 달라집니다. 본인의 꿈에 맞춰 확인해 보세요.

집으로 들어오는 돼지: 8, 12, 25 (안정적인 재물운)

황금돼지/큰 돼지: 1, 10, 45 (강력한 한 방)

돼지떼를 보는 꿈: 17, 24, 38 (여러 곳에서 들어오는 복)

돼지에게 물리는 꿈: 3, 21, 33 (의외의 횡재수)`;

            displayDreamResult({
                numbers: [1, 3, 8, 10, 12, 45],
                explanation: pigDreamText
            });
        });
    }
});