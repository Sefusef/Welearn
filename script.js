let processedImageData = null;

// 1. Unified File Handler
async function handleFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Show status
    document.getElementById('statusLabel').innerText = "Processing image...";

    // Use a Promise to ensure preprocessing is DONE before moving on
    processedImageData = await preprocess(file);
    
    // Update UI Preview
    const img = document.getElementById('uiPreview');
    img.src = processedImageData;
    img.style.display = "block";
    document.getElementById('placeholderText').style.display = "none";
    document.getElementById('statusLabel').innerText = "Image Ready for AI";
}

// 2. Pre-processing with Async/Await
function preprocess(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imgObj = new Image();
            imgObj.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const maxW = 1200;
                const scale = Math.min(1, maxW / imgObj.width);
                canvas.width = imgObj.width * scale;
                canvas.height = imgObj.height * scale;
                
                // Better filters for OCR
                ctx.filter = 'grayscale(100%) contrast(140%)';
                ctx.drawImage(imgObj, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', 0.8));
            };
            imgObj.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

// 3. Execution Engine
async function startAI(mode) {
    if (!processedImageData) return alert("Select an image first!");

    if (!puter.auth.isSignedIn()) {
        puter.auth.signIn();
        return;
    }

    const status = document.getElementById('status');
    const scanLine = document.getElementById('scanLine');
    const resultSection = document.getElementById('resultSection');
    const loaderText = document.getElementById('loaderText');

    scanLine.style.display = "block";
    status.innerText = "Reading text from image...";

    try {
        // OCR Step
        const result = await Tesseract.recognize(processedImageData, 'eng');
        const ocrText = result.data.text;

        status.innerText = "Sending to Llama AI...";
        document.getElementById('inputSection').classList.add('hidden');
        resultSection.classList.remove('hidden');
        document.getElementById('loader').classList.remove('hidden');

        const userDetails = document.getElementById('quizDescription').value;
        let finalPrompt = "";

        if (mode === 'solve') {
            finalPrompt = `SOLVE EVERY QUESTION FROM THIS TEXT: ${ocrText}. Output HTML only.`;
        } else if (mode === 'summarize') {
            finalPrompt = `Summarize this text: ${ocrText}. Output HTML only.`;
        } else if (mode === 'necta') {
            finalPrompt = buildNectaMasterPrompt(userDetails, ocrText);
        }

        // CORRECT PUTER AI CALL
        // Puter expects an array of messages
        const response = await puter.ai.chat([{ role: "user", content: finalPrompt }]);
        
        // Handle response accurately
        const aiText = response.message.content;
        document.getElementById('webViewOutput').innerHTML = aiText;

    } catch (e) {
        status.innerText = "Error occurred. Check console.";
        console.error("AI Error:", e);
    } finally {
        scanLine.style.display = "none";
        document.getElementById('loader').classList.add('hidden');
        status.innerText = "Done!";
    }
}
