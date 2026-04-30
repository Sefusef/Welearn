let processedImageData = null;

// 1. Handle File & Show Preview Immediately
function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const img = document.getElementById('uiPreview');
        img.src = e.target.result;
        img.style.display = "block";
        document.getElementById('placeholderText').style.display = "none";
        document.getElementById('statusLabel').innerText = "Image Loaded Successfully";
    };
    reader.readAsDataURL(file);

    preprocess(file);
}

// 2. Hidden Pre-processing for OCR Accuracy
async function preprocess(file) {
    const imgObj = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
        imgObj.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const maxW = 1200;
            const scale = Math.min(1, maxW / imgObj.width);
            canvas.width = imgObj.width * scale;
            canvas.height = imgObj.height * scale;
            ctx.filter = 'grayscale(100%) contrast(140%)';
            ctx.drawImage(imgObj, 0, 0, canvas.width, canvas.height);
            processedImageData = canvas.toDataURL('image/jpeg', 0.8);
        };
        imgObj.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 3. Execution Engine with Original Java Logic
async function startAI(mode) {
    if (!processedImageData) return alert("Select an image first!");

    const status = document.getElementById('status');
    const scanLine = document.getElementById('scanLine');
    const inputSection = document.getElementById('inputSection');
    const resultSection = document.getElementById('resultSection');
    const loader = document.getElementById('loader');
    const loaderText = document.getElementById('loaderText');

    scanLine.style.display = "block";
    status.innerText = "Initializing OCR Engine...";

    try {
        // OCR Step
        const result = await Tesseract.recognize(processedImageData, 'eng', {
            logger: m => { if(m.status === 'recognizing text') status.innerText = `OCR: ${Math.round(m.progress * 100)}%`; }
        });

        // UI Transition
        inputSection.classList.add('hidden');
        resultSection.classList.remove('hidden');
        loader.classList.remove('hidden');
        loaderText.innerText = "Llama AI is thinking...";

        const userDetails = document.getElementById('quizDescription').value;
        let finalPrompt = "";

        // --- BORROWED LOGIC FROM JAVA Listeners ---
        if (mode === 'solve') {
            finalPrompt = `SOLVE EVERY QUESTION FROM THE IMAGE(S)\n Write the answers in html only,No css <h3> for sections,<p> forquestions and question items. Context: ${result.data.text}`;
        } 
        else if (mode === 'summarize') {
            finalPrompt = `Summarize the content of these images into short, simple and clear notes using headings.\n Write the answers in html only, No css, <h3> for sections,<p> forquestions and question items. Context: ${result.data.text}`;
        } 
        else if (mode === 'necta') {
            finalPrompt = buildNectaMasterPrompt(userDetails, result.data.text);
        }

        // Puter v2 AI Step
        const response = await puter.ai.chat(finalPrompt);
        const text = (typeof response === 'object') ? response.message.content : response;

        document.getElementById('webViewOutput').innerHTML = text;

    } catch (e) {
        status.innerText = "Error. Please try a clearer photo.";
        console.error(e);
    } finally {
        scanLine.style.display = "none";
        loader.classList.add('hidden');
        status.innerText = "Done!";
    }
}

// --- EXACT REPLICATION OF btnGenerateQuiz LOGIC ---
function buildNectaMasterPrompt(userDetails, ocrText) {
    const lowInput = userDetails.toLowerCase();
    
    // 1. NECTA TEMPLATE LOGIC
    let sectionA = "- Multiple Choice Questions (Question 1 Items i to xv).\n- Matching: Column A (Premises) vs Column B (Responses). Question 2 Items: i to v";
    let sectionB = "- Fill in the blanks or short answer questions.\n-Or Re-arrange sentences in a logical sequence.\n -Or Provide short analytical answers. Question 3 items: i to iii, Question 4 items: i to iii, Question 5 items: i to ii, Question 6 items: i to ii";
    let sectionC = "- Study the diagram/story/table/map/image and answer related questions. Question 7 items: i to v";
    let subjectNote = "General NECTA Format English medium.";

    if (lowInput.includes("math") || lowInput.includes("hisabati")) {
        subjectNote = "PRIMARY MATH: NO Multiple Choice.";
        sectionA = "- Question 1 (items: i to x) Basic Operations (+, -, x, ÷ like '1245+2364=') no words like 'perform addition of...'.";
        sectionB = "- Fractions, Decimals, percentages, roman numbers, metric units, time, statistics and algebra (word problems only). Question 2: items: i to vi, Question 3: i to iii, Question 4: i to iii, Question 5: i to iii, Question 6: i to iii.";
        sectionC = "- Geometry (Area/Perimeter) and Data Interpretation from provided images. Question 7: i to iii, Question 8: i to ii.";
    } else if (lowInput.includes("english") || lowInput.includes("kiswahili")) {
        subjectNote = "PRIMARY LANGUAGE.";
        sectionA = "- Question 1: Dictation/Imla/Listening skill (Multiple choice items i to v). Provide the story/sentences for the invigilator at the end.\n- Question 2: Grammar & Vocabulary (Multiple choice items i to v).\n- Question 3: Choose correct word from a box (Items i to v).\n- Question 4: Matching Column A vs B (Items i to v).";
        sectionB = "- Question 5: Verbs in correct form (Items i to v).\n- Question 6: Comprehension passage and questions (Items i to v).";
        sectionC = "- Functional Writing/Rearrange sentences (Items i to vi).";
    }

    // 2. CONVERTING TO HTML MASTER PROMPT
    return `NECTA Senior Examiner Mode. Subject: ${userDetails}\n` +
           `Constraint: ${subjectNote}\n` +
           `Rules: HTML only (<h3>/p/table). No Markdown. No direct recall—use scenarios. No css. ` +
           
           `For Section C, analyze the context to create questions and insert the exact text [MAP_PLACEHOLDER] where appropriate.\n` +
           `Structure:\n` +
           `A: ${sectionA}\n` +
           `B: ${sectionB}\n` +
           `C: ${sectionC}\n` +
           `Add Marking Scheme in <div>. \n\n Context from Image: ${ocrText}`;
}

function resetUI() {
    document.getElementById('resultSection').classList.add('hidden');
    document.getElementById('inputSection').classList.remove('hidden');
}