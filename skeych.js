// 設定 Google 試算表 CSV 題庫網址。
const GOOGLE_SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRylptFGO3-UT8aOlZ80Gzw3rd0dJjzs_TME0ZqQibfUS3bMKTsoK9AdC_7OE-v8PxJDOCUH39dJhYc/pub?gid=1116003502&single=true&output=csv";

// 設定每次測驗抽出的題目數量。
const QUIZ_LENGTH = 5;

// 設定每次測驗抽出的題目數量。
const QUIZ_LENGTH = 5;

// 設定中文字型名稱。
const chineseFont = "Noto Serif TC";

// 設定英文與數字字型名稱。
const latinFont = "Roboto Condensed";

// 設定中文字型備用字型。
const chineseFallbackFont = "serif";

// 設定英數字型備用字型。
const latinFallbackFont = "Arial";

// 儲存完整題庫。
let questionBank = [];

// 儲存本次隨機抽出的題目。
let quizQuestions = [];

// 儲存目前題目的索引值。
let currentQuestion = 0;

// 儲存使用者答對的題數。
let score = 0;

// 儲存使用者選擇的答案索引值。
let selectedAnswer = -1;

// 儲存目前題目是否已答對。
let questionCompleted = false;

// 儲存目前題目是否答錯。
let answerIsWrong = false;

// 儲存正確選項動畫開始時間。
let animationStartTime = 0;

// 儲存選項畫面區域。
let optionAreas = [];

// 儲存下一題按鈕畫面區域。
let nextButtonArea = null;

// 儲存響應式版面設定。
let layout = {};

// 儲存 Google Fonts 是否載入完成。
let fontsReady = false;

// 儲存題庫是否載入完成。
let questionsReady = false;

// 儲存題庫是否正在載入。
let loadingQuestions = true;

// 儲存錯誤訊息。
let loadError = "";

// p5.js 預先載入 Google 試算表 CSV。
function preload() {
  // 讀取 Google 試算表發布的 CSV 資料。
  questionBank = loadTable(
    GOOGLE_SHEET_CSV_URL,
    "csv",
    "header",
    gotQuestions,
    questionLoadFailed
  );
}

// 成功載入 Google 試算表資料時執行。
function gotQuestions(table) {
  // 清空原本的題庫資料。
  questionBank = [];

  // 逐列處理試算表資料。
  for (let rowIndex = 0; rowIndex < table.getRowCount(); rowIndex++) {
    // 取得目前資料列。
    const row = table.getRow(rowIndex);

    // 讀取題目欄位。
    const question = cleanCsvText(row.getString("question"));

    // 讀取選項 A。
    const optionA = cleanCsvText(row.getString("optionA"));

    // 讀取選項 B。
    const optionB = cleanCsvText(row.getString("optionB"));

    // 讀取選項 C。
    const optionC = cleanCsvText(row.getString("optionC"));

    // 讀取選項 D。
    const optionD = cleanCsvText(row.getString("optionD"));

    // 讀取正確答案。
    const answerText = cleanCsvText(
      row.getString("answer")
    ).toUpperCase();

    // 將 A、B、C、D 轉換成 0、1、2、3。
    const answerIndex = letterToIndex(answerText);

    // 判斷這一列資料是否完整。
    const validRow =
      question.length > 0 &&
      optionA.length > 0 &&
      optionB.length > 0 &&
      optionC.length > 0 &&
      optionD.length > 0 &&
      answerIndex >= 0 &&
      answerIndex <= 3;

    // 只加入格式正確的題目。
    if (validRow) {
      // 將目前題目加入題庫。
      questionBank.push({
        // 儲存題目。
        question: question,

        // 儲存四個選項。
        options: [optionA, optionB, optionC, optionD],

        // 儲存正確答案索引。
        answer: answerIndex
      });
    }
  }

  // 判斷題庫是否至少有五道有效題目。
  if (questionBank.length < QUIZ_LENGTH) {
    // 設定題庫不足錯誤訊息。
    loadError =
      "Google 試算表中的有效題目少於 " +
      QUIZ_LENGTH +
      " 題。";

    // 結束函式。
    return;
  }

  // 從題庫隨機抽出五題。
  quizQuestions = selectRandomQuestions(
    questionBank,
    QUIZ_LENGTH
  );

  // 標記題庫讀取完成。
  questionsReady = true;

  // 標記載入流程結束。
  loadingQuestions = false;
}

// Google 試算表載入失敗時執行。
function questionLoadFailed(error) {
  // 設定載入失敗錯誤訊息。
  loadError =
    "無法讀取 Google 試算表，請確認試算表已發布為 CSV。";

  // 標記載入流程結束。
  loadingQuestions = false;

  // 在瀏覽器主控台顯示詳細錯誤。
  console.error(error);
}

// 建立畫布與初始化設定。
function setup() {
  // 建立符合瀏覽器大小的畫布。
  createCanvas(windowWidth, windowHeight);

  // 設定文字水平置中。
  textAlign(CENTER, CENTER);

  // 設定矩形從左上角開始繪製。
  rectMode(CORNER);

  // 關閉圖形外框。
  noStroke();

  // 計算響應式版面。
  calculateLayout();

  // 載入 Google Fonts。
  loadGoogleFonts();
}

// 載入 Google Fonts。
function loadGoogleFonts() {
  // 確認瀏覽器支援 Font Loading API。
  if (document.fonts && document.fonts.ready) {
    // 等待網頁字型載入完成。
    document.fonts.ready
      .then(() => {
        // 載入 Noto Serif TC。
        return document.fonts.load(
          `400 24px "${chineseFont}"`
        );
      })
      .then(() => {
        // 載入 Roboto Condensed。
        return document.fonts.load(
          `400 24px "${latinFont}"`
        );
      })
      .then(() => {
        // 標記字型已載入完成。
        fontsReady = true;
      })
      .catch(() => {
        // 字型載入失敗時使用備用字型。
        fontsReady = false;
      });
  } else {
    // 不支援 Font Loading API 時使用備用字型。
    fontsReady = false;
  }
}

// 持續繪製畫面。
function draw() {
  // 設定背景色。
  background("#18212F");

  // 重新計算響應式版面。
  calculateLayout();

  // 顯示載入畫面。
  if (loadingQuestions) {
    // 繪製載入文字。
    drawLoadingScreen();

    // 結束本次繪製。
    return;
  }

  // 顯示錯誤畫面。
  if (loadError.length > 0) {
    // 繪製錯誤訊息。
    drawErrorScreen();

    // 結束本次繪製。
    return;
  }

  // 顯示測驗結果。
  if (currentQuestion >= quizQuestions.length) {
    // 繪製結果畫面。
    drawResult();

    // 結束本次繪製。
    return;
  }

  // 繪製測驗標題。
  drawHeader();

  // 繪製目前題目。
  drawQuestion();

  // 繪製四個選項。
  drawOptions();

  // 繪製下一題按鈕。
  drawNextButton();
}

// 從完整題庫中隨機抽取指定數量題目。
function selectRandomQuestions(sourceQuestions, amount) {
  // 複製題庫陣列。
  const shuffledQuestions = [...sourceQuestions];

  // 使用 Fisher-Yates 演算法打亂陣列。
  for (let i = shuffledQuestions.length - 1; i > 0; i--) {
    // 產生隨機索引值。
    const randomIndex = floor(random(i + 1));

    // 暫存目前題目。
    const temporaryQuestion = shuffledQuestions[i];

    // 交換題目位置。
    shuffledQuestions[i] = shuffledQuestions[randomIndex];

    // 完成交換。
    shuffledQuestions[randomIndex] = temporaryQuestion;
  }

  // 回傳指定數量的題目。
  return shuffledQuestions.slice(0, amount);
}

// 清理試算表文字內容。
function cleanCsvText(value) {
  // 如果欄位不存在，回傳空字串。
  if (value === null || value === undefined) {
    // 回傳空字串。
    return "";
  }

  // 移除前後空白與 BOM 字元。
  return String(value).replace(/^\uFEFF/, "").trim();
}

// 將答案字母轉成選項索引。
function letterToIndex(letter) {
  // 建立答案字母對應表。
  const answerMap = {
    // A 對應索引 0。
    A: 0,

    // B 對應索引 1。
    B: 1,

    // C 對應索引 2。
    C: 2,

    // D 對應索引 3。
    D: 3
  };

  // 回傳答案索引，無效時回傳 -1。
  return answerMap[letter] ?? -1;
}

// 計算響應式版面尺寸。
function calculateLayout() {
  // 取得畫布寬度。
  const canvasWidth = width;

  // 取得畫布高度。
  const canvasHeight = height;

  // 計算左右安全邊距。
  const sidePadding = constrain(canvasWidth * 0.06, 16, 48);

  // 計算內容最大寬度。
  const contentWidth = min(canvasWidth - sidePadding * 2, 820);

  // 判斷是否為窄版手機。
  const isSmallScreen = canvasWidth < 480;

  // 判斷是否為橫向畫面。
  const isLandscape = canvasWidth > canvasHeight;

  // 計算標題文字大小。
  const titleSize = isSmallScreen
    ? min(28, canvasWidth * 0.075)
    : isLandscape
      ? min(34, canvasWidth * 0.055)
      : min(42, canvasWidth * 0.075);

  // 計算一般文字大小。
  const bodySize = isSmallScreen
    ? min(18, canvasWidth * 0.048)
    : min(23, canvasWidth * 0.04);

  // 計算題目文字大小。
  const questionSize = isSmallScreen
    ? min(22, canvasWidth * 0.06)
    : isLandscape
      ? min(25, canvasWidth * 0.04)
      : min(30, canvasWidth * 0.055);

  // 計算選項高度。
  const optionHeight = isSmallScreen ? 56 : 64;

  // 計算選項起始位置。
  const optionStartY = isLandscape
    ? max(170, canvasHeight * 0.31)
    : max(220, canvasHeight * 0.29);

  // 計算選項間距。
  const optionGap = isSmallScreen ? 12 : 16;

  // 計算按鈕高度。
  const buttonHeight = isSmallScreen ? 52 : 58;

  // 計算按鈕寬度。
  const buttonWidth = min(
    contentWidth,
    isSmallScreen ? 260 : 300
  );

  // 計算選項總高度。
  const optionsTotalHeight =
    optionHeight * 4 + optionGap * 3;

  // 計算按鈕垂直位置。
  const buttonY = isLandscape
    ? min(
        canvasHeight - buttonHeight - 16,
        optionStartY + optionsTotalHeight + 22
      )
    : min(
        canvasHeight - buttonHeight - 20,
        optionStartY + optionsTotalHeight + 24
      );

  // 儲存響應式版面設定。
  layout = {
    // 儲存內容寬度。
    contentWidth: contentWidth,

    // 儲存標題大小。
    titleSize: titleSize,

    // 儲存一般文字大小。
    bodySize: bodySize,

    // 儲存題目大小。
    questionSize: questionSize,

    // 儲存選項高度。
    optionHeight: optionHeight,

    // 儲存選項起始位置。
    optionStartY: optionStartY,

    // 儲存選項間距。
    optionGap: optionGap,

    // 儲存按鈕寬度。
    buttonWidth: buttonWidth,

    // 儲存按鈕高度。
    buttonHeight: buttonHeight,

    // 儲存按鈕垂直位置。
    buttonY: buttonY,

    // 儲存是否為窄版畫面。
    isSmallScreen: isSmallScreen,

    // 儲存是否為橫向畫面。
    isLandscape: isLandscape
  };
}

// 設定中文字型。
function setChineseFont(fontSizeValue) {
  // Google Fonts 載入完成時使用 Noto Serif TC。
  if (fontsReady) {
    // 設定中文字型。
    textFont(chineseFont);
  } else {
    // 載入失敗時使用備用中文字型。
    textFont(chineseFallbackFont);
  }

  // 設定文字大小。
  textSize(fontSizeValue);
}

// 設定英文與數字字型。
function setLatinFont(fontSizeValue) {
  // Google Fonts 載入完成時使用 Roboto Condensed。
  if (fontsReady) {
    // 設定英數字型。
    textFont(latinFont);
  } else {
    // 載入失敗時使用備用英數字型。
    textFont(latinFallbackFont);
  }

  // 設定文字大小。
  textSize(fontSizeValue);
}

// 判斷指定字元是否為中文。
function isChineseCharacter(character) {
  // 使用 Unicode 範圍判斷中文與中文標點。
  return /[\u3000-\u303F\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]/.test(
    character
  );
}

// 計算單一字元寬度。
function measureCharacter(character, fontSizeValue) {
  // 中文字元使用中文字型。
  if (isChineseCharacter(character)) {
    // 設定中文字型。
    setChineseFont(fontSizeValue);
  } else {
    // 英文、數字與符號使用英數字型。
    setLatinFont(fontSizeValue);
  }

  // 回傳字元寬度。
  return textWidth(character);
}

// 計算混合文字總寬度。
function measureMixedText(textContent, fontSizeValue) {
  // 建立文字總寬度。
  let totalWidth = 0;

  // 逐一處理每個字元。
  for (let i = 0; i < textContent.length; i++) {
    // 累加目前字元寬度。
    totalWidth += measureCharacter(
      textContent[i],
      fontSizeValue
    );
  }

  // 回傳文字總寬度。
  return totalWidth;
}

// 逐字繪製中英文混合文字。
function drawMixedText(
  textContent,
  centerX,
  centerY,
  fontSizeValue
) {
  // 計算整段文字總寬度。
  const totalWidth = measureMixedText(
    textContent,
    fontSizeValue
  );

  // 計算起始水平位置。
  let currentX = centerX - totalWidth / 2;

  // 逐一繪製每個字元。
  for (let i = 0; i < textContent.length; i++) {
    // 取得目前字元。
    const character = textContent[i];

    // 根據字元類型設定字型。
    if (isChineseCharacter(character)) {
      // 使用中文字型。
      setChineseFont(fontSizeValue);
    } else {
      // 使用英數字型。
      setLatinFont(fontSizeValue);
    }

    // 計算目前字元寬度。
    const characterWidth = textWidth(character);

    // 繪製目前字元。
    text(
      character,
      currentX + characterWidth / 2,
      centerY
    );

    // 移動到下一個字元位置。
    currentX += characterWidth;
  }
}

// 在指定區域內繪製混合文字。
function drawMixedTextInBox(
  textContent,
  centerX,
  centerY,
  boxWidth,
  boxHeight,
  fontSizeValue
) {
  // 計算文字寬度。
  const textWidthValue = measureMixedText(
    textContent,
    fontSizeValue
  );

  // 如果文字沒有超出寬度，直接繪製單行。
  if (textWidthValue <= boxWidth) {
    // 繪製單行文字。
    drawMixedText(
      textContent,
      centerX,
      centerY,
      fontSizeValue
    );

    // 結束函式。
    return;
  }

  // 依照空白分割文字。
  const words = textContent.split(" ");

  // 建立多行文字陣列。
  const lines = [];

  // 建立目前文字行。
  let currentLine = "";

  // 逐一處理文字片段。
  for (let i = 0; i < words.length; i++) {
    // 建立測試文字行。
    const testLine =
      currentLine.length === 0
        ? words[i]
        : currentLine + " " + words[i];

    // 判斷測試行是否超出寬度。
    if (
      measureMixedText(testLine, fontSizeValue) <=
      boxWidth
    ) {
      // 將片段加入目前文字行。
      currentLine = testLine;
    } else {
      // 將目前文字行加入多行陣列。
      lines.push(currentLine);

      // 開始新的文字行。
      currentLine = words[i];
    }
  }

  // 將最後一行加入陣列。
  if (currentLine.length > 0) {
    // 儲存最後文字行。
    lines.push(currentLine);
  }

  // 計算行高。
  const lineHeight = fontSizeValue * 1.35;

  // 計算總高度。
  const totalHeight = lines.length * lineHeight;

  // 計算第一行位置。
  let lineY = centerY - totalHeight / 2 + lineHeight / 2;

  // 逐行繪製文字。
  for (let i = 0; i < lines.length; i++) {
    // 繪製目前文字行。
    drawMixedText(
      lines[i],
      centerX,
      lineY,
      fontSizeValue
    );

    // 移動到下一行。
    lineY += lineHeight;
  }
}

// 繪製載入畫面。
function drawLoadingScreen() {
  // 設定載入文字顏色。
  fill("#FFFFFF");

  // 顯示載入文字。
  drawMixedText(
    "正在從 Google 試算表載入題庫...",
    width / 2,
    height / 2,
    layout.bodySize
  );
}

// 繪製錯誤畫面。
function drawErrorScreen() {
  // 設定錯誤文字顏色。
  fill("#F7B1B0");

  // 顯示錯誤訊息。
  drawMixedTextInBox(
    loadError,
    width / 2,
    height / 2,
    layout.contentWidth,
    140,
    layout.bodySize
  );
}

// 繪製標題與進度。
function drawHeader() {
  // 設定標題文字顏色。
  fill("#FFFFFF");

  // 計算標題垂直位置。
  const titleY = max(
    30,
    min(48, height * 0.075)
  );

  // 顯示標題。
  drawMixedText(
    "p5.js 簡易指令測驗",
    width / 2,
    titleY,
    layout.titleSize
  );

  // 設定進度文字顏色。
  fill("#B7C7D9");

  // 計算進度垂直位置。
  const progressY =
    titleY + layout.titleSize * 1.35;

  // 顯示目前進度。
  drawMixedText(
    "第 " +
      (currentQuestion + 1) +
      " 題／共 " +
      QUIZ_LENGTH +
      " 題",
    width / 2,
    progressY,
    layout.bodySize
  );
}

// 繪製目前題目。
function drawQuestion() {
  // 設定題目文字顏色。
  fill("#FFFFFF");

  // 計算題目垂直位置。
  const questionY = layout.isSmallScreen
    ? 142
    : 150;

  // 計算題目區域高度。
  const questionHeight = layout.isSmallScreen
    ? 88
    : 100;

  // 顯示目前題目。
  drawMixedTextInBox(
    quizQuestions[currentQuestion].question,
    width / 2,
    questionY,
    layout.contentWidth,
    questionHeight,
    layout.questionSize
  );
}

// 繪製四個選項。
function drawOptions() {
  // 清除上一幀的選項區域。
  optionAreas = [];

  // 計算選項水平位置。
  const optionX =
    (width - layout.contentWidth) / 2;

  // 逐一繪製四個選項。
  for (let i = 0; i < 4; i++) {
    // 計算目前選項垂直位置。
    let optionY =
      layout.optionStartY +
      i *
        (layout.optionHeight +
          layout.optionGap);

    // 判斷是否需要讓正確答案跳動。
    if (
      answerIsWrong &&
      i === quizQuestions[currentQuestion].answer
    ) {
      // 計算跳動位移。
      const bounceOffset =
        sin(
          (millis() - animationStartTime) *
            0.012
        ) * 9;

      // 套用跳動位移。
      optionY += bounceOffset;
    }

    // 儲存選項區域。
    optionAreas.push({
      // 設定選項水平位置。
      x: optionX,

      // 設定選項垂直位置。
      y: optionY,

      // 設定選項寬度。
      width: layout.contentWidth,

      // 設定選項高度。
      height: layout.optionHeight
    });

    // 判斷是否為答錯後的正確選項。
    if (
      answerIsWrong &&
      i === quizQuestions[currentQuestion].answer
    ) {
      // 使用指定粉紅色背景。
      fill("#F7B1B0");
    } else if (
      questionCompleted &&
      i === selectedAnswer
    ) {
      // 答對選項使用綠色背景。
      fill("#79D6A5");
    } else {
      // 一般選項使用深色背景。
      fill("#2D4055");
    }

    // 繪製選項背景。
    rect(
      optionX,
      optionY,
      layout.contentWidth,
      layout.optionHeight,
      12
    );

    // 判斷目前是否為正確選項。
    if (
      answerIsWrong &&
      i === quizQuestions[currentQuestion].answer
    ) {
      // 設定深色文字。
      fill("#351D22");
    } else {
      // 設定白色文字。
      fill("#FFFFFF");
    }

    // 建立選項文字。
    const optionText =
      String.fromCharCode(65 + i) +
      ". " +
      quizQuestions[currentQuestion].options[i];

    // 繪製選項文字。
    drawMixedText(
      optionText,
      optionX + layout.contentWidth / 2,
      optionY + layout.optionHeight / 2,
      layout.bodySize
    );
  }
}

// 繪製下一題按鈕。
function drawNextButton() {
  // 尚未答對時不顯示按鈕。
  if (!questionCompleted) {
    // 清除按鈕區域。
    nextButtonArea = null;

    // 結束函式。
    return;
  }

  // 計算按鈕水平位置。
  const buttonX =
    (width - layout.buttonWidth) / 2;

  // 儲存按鈕區域。
  nextButtonArea = {
    // 儲存按鈕水平位置。
    x: buttonX,

    // 儲存按鈕垂直位置。
    y: layout.buttonY,

    // 儲存按鈕寬度。
    width: layout.buttonWidth,

    // 儲存按鈕高度。
    height: layout.buttonHeight
  };

  // 設定按鈕背景色。
  fill("#4B9FE1");

  // 繪製按鈕。
  rect(
    buttonX,
    layout.buttonY,
    layout.buttonWidth,
    layout.buttonHeight,
    12
  );

  // 設定按鈕文字顏色。
  fill("#FFFFFF");

  // 判斷按鈕文字。
  const buttonText =
    currentQuestion === quizQuestions.length - 1
      ? "查看結果"
      : "下一題";

  // 繪製按鈕文字。
  drawMixedText(
    buttonText,
    width / 2,
    layout.buttonY +
      layout.buttonHeight / 2,
    layout.bodySize
  );
}

// 處理滑鼠點擊事件。
function mousePressed() {
  // 題庫尚未完成時不處理點擊。
  if (
    loadingQuestions ||
    !questionsReady ||
    loadError.length > 0
  ) {
    // 結束函式。
    return;
  }

  // 測驗完成後不處理點擊。
  if (currentQuestion >= quizQuestions.length) {
    // 結束函式。
    return;
  }

  // 如果題目已答對，檢查下一題按鈕。
  if (questionCompleted) {
    // 確認按鈕存在。
    if (nextButtonArea !== null) {
      // 判斷是否點擊按鈕。
      if (
        isPointInside(
          mouseX,
          mouseY,
          nextButtonArea
        )
      ) {
        // 前往下一題。
        nextQuestion();
      }
    }

    // 結束函式。
    return;
  }

  // 逐一檢查四個選項。
  for (let i = 0; i < optionAreas.length; i++) {
    // 判斷是否點擊目前選項。
    if (
      isPointInside(
        mouseX,
        mouseY,
        optionAreas[i]
      )
    ) {
      // 檢查使用者答案。
      checkAnswer(i);

      // 結束迴圈。
      return;
    }
  }
}

// 處理手機觸控事件。
function touchStarted() {
  // 執行滑鼠點擊邏輯。
  mousePressed();

  // 防止瀏覽器捲動。
  return false;
}

// 檢查使用者答案。
function checkAnswer(answerIndex) {
  // 儲存使用者選擇。
  selectedAnswer = answerIndex;

  // 判斷答案是否正確。
  if (
    answerIndex ===
    quizQuestions[currentQuestion].answer
  ) {
    // 設定題目完成。
    questionCompleted = true;

    // 清除錯誤狀態。
    answerIsWrong = false;

    // 增加答對題數。
    score++;
  } else {
    // 設定答錯狀態。
    answerIsWrong = true;

    // 記錄動畫開始時間。
    animationStartTime = millis();
  }
}

// 前往下一題。
function nextQuestion() {
  // 增加目前題目的索引。
  currentQuestion++;

  // 清除選擇答案。
  selectedAnswer = -1;

  // 清除完成狀態。
  questionCompleted = false;

  // 清除錯誤狀態。
  answerIsWrong = false;

  // 清除按鈕區域。
  nextButtonArea = null;
}

// 繪製最後結果。
function drawResult() {
  // 設定結果標題顏色。
  fill("#FFFFFF");

  // 顯示結果標題。
  drawMixedText(
    "測驗完成！",
    width / 2,
    height * 0.32,
    min(50, width * 0.09)
  );

  // 設定分數顏色。
  fill("#F7B1B0");

  // 建立分數文字。
  const resultText =
    "你答對了 " +
    score +
    "／" +
    QUIZ_LENGTH +
    " 題";

  // 顯示分數。
  drawMixedText(
    resultText,
    width / 2,
    height * 0.47,
    min(38, width * 0.07)
  );

  // 設定提示文字顏色。
  fill("#B7C7D9");

  // 顯示提示文字。
  drawMixedText(
    "感謝完成 p5.js 指令測驗！",
    width / 2,
    height * 0.58,
    min(24, width * 0.045)
  );
}

// 判斷座標是否位於指定矩形內。
function isPointInside(pointX, pointY, area) {
  // 回傳座標是否位於矩形範圍內。
  return (
    pointX >= area.x &&
    pointX <= area.x + area.width &&
    pointY >= area.y &&
    pointY <= area.y + area.height
  );
}

// 視窗大小改變時重新調整畫布。
function windowResized() {
  // 調整畫布大小。
  resizeCanvas(windowWidth, windowHeight);

  // 重新計算響應式版面。
  calculateLayout();
}
