function parseDigitSet(raw) {
  if (!raw.trim()) return new Set();
  const values = raw
    .split(/[,\uff0c\s;；、|]+/)
    .map((s) => s.trim())
    .filter((s) => s !== "");

  for (const v of values) {
    if (!/^\d$/.test(v)) {
      throw new Error(`数字输入无效：${v}（请使用 0-9）`);
    }
  }
  return new Set(values.map(Number));
}

function parseSmallCountSet(raw, label) {
  if (!raw.trim()) return new Set();
  const values = raw
    .split(/[,\uff0c\s;；、|]+/)
    .map((s) => s.trim())
    .filter((s) => s !== "");

  const parsed = values.map((v) => {
    if (!/^[0-3]$/.test(v)) {
      throw new Error(`${label}输入无效：${v}（只能填 0-3）`);
    }
    return Number(v);
  });
  return new Set(parsed);
}

function parseGroupSet(raw) {
  if (!raw.trim()) return new Set();
  const values = raw
    .split(/[,\uff0c\s;；、|]+/)
    .map((s) => s.trim())
    .filter((s) => s !== "");
  const allowed = new Set(["group3", "group6"]);
  values.forEach((value) => {
    if (!allowed.has(value)) {
      throw new Error(`组态输入无效：${value}`);
    }
  });
  return new Set(values);
}

function normalizeTwoCodeCombo(value) {
  if (!/^\d{2}$/.test(value)) {
    throw new Error(`2码组合输入无效：${value}（请使用两位数字，如 12）`);
  }
  return value.split("").sort().join("");
}

function parseTwoCodeSet(raw) {
  if (!raw.trim()) return new Set();
  const values = raw
    .split(/[,\uff0c\s;；、|]+/)
    .map((s) => s.trim())
    .filter((s) => s !== "")
    .map(normalizeTwoCodeCombo);
  return new Set(values);
}

function parseNumberSet(raw) {
  if (!raw.trim()) return new Set();
  const values = raw
    .split(/[,\uff0c\s;；、|]+/)
    .map((s) => s.trim())
    .filter((s) => s !== "");

  const parsed = values.map((v) => {
    if (!/^\d+$/.test(v)) {
      throw new Error(`和值输入无效：${v}`);
    }
    return Number(v);
  });
  return new Set(parsed);
}

function parseBound(raw, label, min, max) {
  const v = raw.trim();
  if (!v) return null;
  if (!/^\d+$/.test(v)) {
    throw new Error(`${label}输入无效：${v}`);
  }
  const num = Number(v);
  if (num < min || num > max) {
    throw new Error(`${label}必须在 ${min}-${max} 之间`);
  }
  return num;
}

function parseIssue(raw) {
  const issue = raw.trim();
  if (!issue) {
    throw new Error("期号不能为空");
  }
  if (!/^\d{5,}$/.test(issue)) {
    throw new Error("期号格式不正确（建议至少 5 位数字）");
  }
  return issue;
}

function parseThreeDigitNumber(raw) {
  const value = raw.trim();
  if (!/^\d{3}$/.test(value)) {
    throw new Error("开奖号必须是 3 位数字（如 386）");
  }
  return value;
}

function classify(digits) {
  const unique = new Set(digits).size;
  return {
    isTriplet: unique === 1,
    isPair: unique === 2
  };
}

function hasConsecutiveDigits(digits) {
  const uniq = [...new Set(digits)].sort((a, b) => a - b);
  for (let i = 0; i < uniq.length - 1; i += 1) {
    if (uniq[i + 1] - uniq[i] === 1) return true;
  }
  return false;
}

function getTwoCodeCombos(digits) {
  const combos = new Set();
  for (let i = 0; i < digits.length - 1; i += 1) {
    for (let j = i + 1; j < digits.length; j += 1) {
      combos.add([digits[i], digits[j]].sort((a, b) => a - b).join(""));
    }
  }
  return combos;
}

function formatNum(n) {
  return n.toString().padStart(3, "0");
}

function parseCandidates(raw) {
  if (!raw.trim()) return [];
  const tokens = raw
    .split(/[,\uff0c\s;；、|]+/)
    .map((s) => s.trim())
    .filter((s) => s !== "");

  const unique = new Set();
  const result = [];
  tokens.forEach((token) => {
    if (!/^\d{3}$/.test(token)) {
      throw new Error(`当前结果中存在无效号码：${token}（应为 3 位数字）`);
    }
    if (unique.has(token)) return;
    unique.add(token);
    result.push(token);
  });
  return result;
}

function toGroupKey(text) {
  return text.split("").sort().join("");
}

function applyPlayMode(list, playMode) {
  if (playMode !== "group") return list;
  const unique = new Set();
  const grouped = [];
  list.forEach((text) => {
    const key = toGroupKey(text);
    if (unique.has(key)) return;
    unique.add(key);
    grouped.push(key);
  });
  return grouped;
}

function shouldKeepNumber(text, config) {
  const digits = text.split("").map(Number); // [百, 十, 个]
  const sum = digits[0] + digits[1] + digits[2];
  const sumTail = sum % 10;
  const span = Math.max(...digits) - Math.min(...digits);
  const oddCount = digits.filter((d) => d % 2 === 1).length;
  const bigCount = digits.filter((d) => d >= 5).length;
  const hasConsecutive = hasConsecutiveDigits(digits);
  const twoCodeCombos = getTwoCodeCombos(digits);
  const routes = new Set(digits.map((d) => d % 3));
  const { isPair, isTriplet } = classify(digits);
  const isAllDiff = !isPair && !isTriplet;

  if (digits.some((d) => config.excludeDigits.has(d))) return false;
  if (digits.some((d) => config.killDigits.has(d))) return false;
  if (config.excludeSums.has(sum)) return false;
  if (config.includeSumTails.size > 0 && !config.includeSumTails.has(sumTail)) return false;
  if (config.excludeSumTails.has(sumTail)) return false;
  if (config.includeSpans.size > 0 && !config.includeSpans.has(span)) return false;
  if (config.excludeSpans.has(span)) return false;
  if (config.sumMin !== null && sum < config.sumMin) return false;
  if (config.sumMax !== null && sum > config.sumMax) return false;
  if (config.spanMin !== null && span < config.spanMin) return false;
  if (config.spanMax !== null && span > config.spanMax) return false;
  if (config.excludePair && isPair) return false;
  if (config.excludeTriplet && isTriplet) return false;

  if (config.patternType === "triplet" && !isTriplet) return false;
  if (config.patternType === "pair" && !isPair) return false;
  if (config.patternType === "allDiff" && !isAllDiff) return false;
  if (config.includeGroups.size > 0) {
    const hitGroup = (isPair && config.includeGroups.has("group3")) || (isAllDiff && config.includeGroups.has("group6"));
    if (!hitGroup) return false;
  }
  if (config.consecutiveType === "has" && !hasConsecutive) return false;
  if (config.consecutiveType === "no" && hasConsecutive) return false;

  if (config.includeDigits.size > 0) {
    const hasIncluded = digits.some((d) => config.includeDigits.has(d));
    if (!hasIncluded) return false;
  }

  if (config.danmaDigits.size > 0) {
    const hitDanma = digits.some((d) => config.danmaDigits.has(d));
    if (!hitDanma) return false;
  }

  if (config.includeOddCounts.size > 0 && !config.includeOddCounts.has(oddCount)) return false;
  if (config.excludeOddCounts.has(oddCount)) return false;
  if (config.includeBigCounts.size > 0 && !config.includeBigCounts.has(bigCount)) return false;
  if (config.excludeBigCounts.has(bigCount)) return false;

  if (config.includeTwoCodeCombos.size > 0) {
    const hitTwoCode = [...config.includeTwoCodeCombos].some((combo) => twoCodeCombos.has(combo));
    if (!hitTwoCode) return false;
  }
  if ([...config.excludeTwoCodeCombos].some((combo) => twoCodeCombos.has(combo))) return false;

  if (config.routes012.size > 0) {
    const hitRoute = [...routes].some((r) => config.routes012.has(r));
    if (!hitRoute) return false;
  }

  if (config.posBInclude.size > 0 && !config.posBInclude.has(digits[0])) return false;
  if (config.posSInclude.size > 0 && !config.posSInclude.has(digits[1])) return false;
  if (config.posGInclude.size > 0 && !config.posGInclude.has(digits[2])) return false;

  if (config.posBExclude.has(digits[0])) return false;
  if (config.posSExclude.has(digits[1])) return false;
  if (config.posGExclude.has(digits[2])) return false;

  return true;
}

function filterNumbers(candidates, config) {
  const filtered = candidates.filter((text) => shouldKeepNumber(text, config));
  return applyPlayMode(filtered, config.playMode);
}

function allNumbers() {
  const numbers = [];
  for (let n = 0; n <= 999; n += 1) {
    numbers.push(formatNum(n));
  }
  return numbers;
}

function buildConfigFromRaw(raw) {
  const config = {
    excludeDigits: new Set(raw.excludeDigits),
    includeDigits: parseDigitSet(raw.includeDigits),
    excludeSums: parseNumberSet(raw.excludeSums),
    includeSumTails: parseDigitSet(raw.includeSumTails),
    excludeSumTails: parseDigitSet(raw.excludeSumTails),
    includeSpans: parseDigitSet(raw.includeSpans),
    excludeSpans: parseDigitSet(raw.excludeSpans),
    sumMin: parseBound(raw.sumMin, "和值最小值", 0, 27),
    sumMax: parseBound(raw.sumMax, "和值最大值", 0, 27),
    spanMin: parseBound(raw.spanMin, "跨度最小值", 0, 9),
    spanMax: parseBound(raw.spanMax, "跨度最大值", 0, 9),
    includeGroups: parseGroupSet(raw.includeGroups || ""),
    includeTwoCodeCombos: parseTwoCodeSet(raw.includeTwoCodeCombos || ""),
    excludeTwoCodeCombos: parseTwoCodeSet(raw.excludeTwoCodeCombos || ""),
    patternType: raw.patternType,
    playMode: raw.playMode,
    consecutiveType: raw.consecutiveType,
    excludePair: raw.excludePair,
    excludeTriplet: raw.excludeTriplet,
    danmaDigits: parseDigitSet(raw.danmaDigits),
    killDigits: parseDigitSet(raw.killDigits),
    includeOddCounts: parseSmallCountSet(raw.includeOddCounts || raw.oddCounts || "", "保留单双"),
    excludeOddCounts: parseSmallCountSet(raw.excludeOddCounts || "", "排除单双"),
    includeBigCounts: parseSmallCountSet(raw.includeBigCounts || raw.bigCounts || "", "保留大小"),
    excludeBigCounts: parseSmallCountSet(raw.excludeBigCounts || "", "排除大小"),
    routes012: parseDigitSet(raw.routes012),
    posBInclude: parseDigitSet(raw.posBInclude),
    posSInclude: parseDigitSet(raw.posSInclude),
    posGInclude: parseDigitSet(raw.posGInclude),
    posBExclude: parseDigitSet(raw.posBExclude),
    posSExclude: parseDigitSet(raw.posSExclude),
    posGExclude: parseDigitSet(raw.posGExclude)
  };

  if (config.sumMin !== null && config.sumMax !== null && config.sumMin > config.sumMax) {
    throw new Error("和值最小值不能大于最大值");
  }
  if (config.spanMin !== null && config.spanMax !== null && config.spanMin > config.spanMax) {
    throw new Error("跨度最小值不能大于最大值");
  }
  if ([...config.routes012].some((v) => v < 0 || v > 2)) {
    throw new Error("012 路只能填写 0,1,2");
  }
  if (!["direct", "group"].includes(config.playMode)) {
    throw new Error("玩法筛选参数无效");
  }

  return config;
}

function captureRawFilters() {
  return {
    excludeDigits: [...excludedDigitsByButtons].sort((a, b) => a - b),
    includeDigits: els.includeDigits ? els.includeDigits.value : "",
    excludeSums: els.qExcludeSums ? els.qExcludeSums.value : (els.excludeSums ? els.excludeSums.value : ""),
    includeSumTails: els.qIncludeSumTails ? els.qIncludeSumTails.value : (els.includeSumTails ? els.includeSumTails.value : ""),
    excludeSumTails: els.qExcludeSumTails ? els.qExcludeSumTails.value : (els.excludeSumTails ? els.excludeSumTails.value : ""),
    includeSpans: els.qIncludeSpans ? els.qIncludeSpans.value : "",
    excludeSpans: els.qExcludeSpans ? els.qExcludeSpans.value : "",
    sumMin: els.qSumMin ? els.qSumMin.value : (els.sumMin ? els.sumMin.value : ""),
    sumMax: els.qSumMax ? els.qSumMax.value : (els.sumMax ? els.sumMax.value : ""),
    spanMin: els.qSpanMin ? els.qSpanMin.value : (els.spanMin ? els.spanMin.value : ""),
    spanMax: els.qSpanMax ? els.qSpanMax.value : (els.spanMax ? els.spanMax.value : ""),
    includeGroups: els.qIncludeGroups ? els.qIncludeGroups.value : "",
    includeTwoCodeCombos: els.qIncludeTwoCodeCombos ? els.qIncludeTwoCodeCombos.value : "",
    excludeTwoCodeCombos: els.qExcludeTwoCodeCombos ? els.qExcludeTwoCodeCombos.value : "",
    patternType: els.patternType ? els.patternType.value : "all",
    playMode: els.playMode ? els.playMode.value : "direct",
    consecutiveType: els.consecutiveType ? els.consecutiveType.value : "all",
    excludePair: els.excludePair ? els.excludePair.checked : false,
    excludeTriplet: els.excludeTriplet ? els.excludeTriplet.checked : false,
    danmaDigits: "",
    killDigits: "",
    includeOddCounts: els.qIncludeOddCounts ? els.qIncludeOddCounts.value : "",
    excludeOddCounts: els.qExcludeOddCounts ? els.qExcludeOddCounts.value : "",
    includeBigCounts: els.qIncludeBigCounts ? els.qIncludeBigCounts.value : "",
    excludeBigCounts: els.qExcludeBigCounts ? els.qExcludeBigCounts.value : "",
    routes012: els.qRoutes012 ? els.qRoutes012.value : "",
    posBInclude: "",
    posSInclude: "",
    posGInclude: "",
    posBExclude: "",
    posSExclude: "",
    posGExclude: ""
  };
}

function buildConfig() {
  return buildConfigFromRaw(captureRawFilters());
}

function rememberUndoState() {
  undoStack.push({
    count: els.count ? els.count.textContent : "0",
    result: els.result ? els.result.value : "",
    sourceScope: els.sourceScope ? els.sourceScope.value : "full"
  });
  if (undoStack.length > 20) undoStack.shift();
}

function undoLastChange() {
  const previous = undoStack.pop();
  if (!previous) {
    alert("没有可以后退的步骤");
    return;
  }
  if (els.count) els.count.textContent = previous.count;
  if (els.result) els.result.value = previous.result;
  if (els.sourceScope) els.sourceScope.value = previous.sourceScope;
  syncPasteModeVisual();
  if (els.result && typeof els.result.scrollIntoView === "function") {
    const target = isMobileViewport() ? els.result.closest(".result-panel") : els.result;
    (target || els.result).scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
}

const els = {
  excludeDigitsButtons: document.getElementById("excludeDigitsButtons"),
  includeDigits: document.getElementById("includeDigits"),
  qExcludeSums: document.getElementById("qExcludeSums"),
  qIncludeSumTails: document.getElementById("qIncludeSumTails"),
  qExcludeSumTails: document.getElementById("qExcludeSumTails"),
  qIncludeSpans: document.getElementById("qIncludeSpans"),
  qExcludeSpans: document.getElementById("qExcludeSpans"),
  qSumMin: document.getElementById("qSumMin"),
  qSumMax: document.getElementById("qSumMax"),
  qSpanMin: document.getElementById("qSpanMin"),
  qSpanMax: document.getElementById("qSpanMax"),
  qIncludeGroups: document.getElementById("qIncludeGroups"),
  qIncludeTwoCodeCombos: document.getElementById("qIncludeTwoCodeCombos"),
  qExcludeTwoCodeCombos: document.getElementById("qExcludeTwoCodeCombos"),
  qRoutes012: document.getElementById("qRoutes012"),
  qIncludeBigCounts: document.getElementById("qIncludeBigCounts"),
  qExcludeBigCounts: document.getElementById("qExcludeBigCounts"),
  qIncludeOddCounts: document.getElementById("qIncludeOddCounts"),
  qExcludeOddCounts: document.getElementById("qExcludeOddCounts"),
  excludeSums: document.getElementById("excludeSums"),
  includeSumTails: document.getElementById("includeSumTails"),
  excludeSumTails: document.getElementById("excludeSumTails"),
  sumMin: document.getElementById("sumMin"),
  sumMax: document.getElementById("sumMax"),
  spanMin: document.getElementById("spanMin"),
  spanMax: document.getElementById("spanMax"),
  patternType: document.getElementById("patternType"),
  playMode: document.getElementById("playMode"),
  consecutiveType: document.getElementById("consecutiveType"),
  excludePair: document.getElementById("excludePair"),
  excludeTriplet: document.getElementById("excludeTriplet"),
  historyIssue: document.getElementById("historyIssue"),
  historyNumber: document.getElementById("historyNumber"),
  addHistoryBtn: document.getElementById("addHistoryBtn"),
  clearHistoryBtn: document.getElementById("clearHistoryBtn"),
  historyCount: document.getElementById("historyCount"),
  historyList: document.getElementById("historyList"),
  sourceScope: document.getElementById("sourceScope"),
  runBtn: document.getElementById("runBtn"),
  undoBtn: document.getElementById("undoBtn"),
  clearResultBtn: document.getElementById("clearResultBtn"),
  resetBtn: document.getElementById("resetBtn"),
  customPool: document.getElementById("customPool"),
  clearCustomPoolBtn: document.getElementById("clearCustomPoolBtn"),
  count: document.getElementById("count"),
  result: document.getElementById("result")
};

const HISTORY_STORAGE_KEY = "lottery3d_history_v1";
let historyRecords = [];
const undoStack = [];
const excludedDigitsByButtons = new Set();

function isMobileViewport() {
  return window.matchMedia("(max-width: 1080px)").matches;
}

function getValuesFromInput(input) {
  const value = typeof input === "string" ? input : input && input.value;
  if (typeof value !== "string") return [];
  return value
    .split(/[,\uff0c\s;；、|]+/)
    .map((s) => s.trim())
    .filter((s) => s !== "");
}

function setValuesToInput(input, selectedValues) {
  input.value = selectedValues.join(",");
}

function syncPickerFromInput(picker) {
  const inputId = picker.dataset.bindInput;
  const input = document.getElementById(inputId);
  if (!input) return;
  const selectedSet = new Set(getValuesFromInput(input.value));
  picker.querySelectorAll(".quick-picker-option").forEach((btn) => {
    const value = btn.dataset.value || "";
    btn.classList.toggle("active", selectedSet.has(value));
  });
}

function syncInputFromPicker(picker) {
  const inputId = picker.dataset.bindInput;
  const input = document.getElementById(inputId);
  if (!input) return;
  const selected = [...picker.querySelectorAll(".quick-picker-option.active")]
    .map((btn) => btn.dataset.value || "")
    .filter(Boolean);
  setValuesToInput(input, selected);
  updateQuickFilterButtons();
}

function closeQuickFilterPanels() {
  document.querySelectorAll(".quick-filter-panel").forEach((panel) => {
    panel.hidden = true;
  });
  document.querySelectorAll(".quick-filter-toggle").forEach((btn) => {
    btn.classList.remove("active");
  });
}

function updateQuickFilterButtons() {
  document.querySelectorAll(".quick-filter-toggle").forEach((btn) => {
    const label = btn.dataset.label || btn.textContent.trim();
    let count = 0;
    if (btn.dataset.filterTarget === "excludeDigitsPanel") {
      count = excludedDigitsByButtons.size;
    }
    if (btn.dataset.filterTarget === "includeDigitsPanel" && els.includeDigits) {
      count = getValuesFromInput(els.includeDigits).length;
    }
    if (btn.dataset.filterTarget === "sumPanel") {
      count =
        getValuesFromInput(els.qExcludeSums).length +
        (els.qSumMin && els.qSumMin.value ? 1 : 0) +
        (els.qSumMax && els.qSumMax.value ? 1 : 0);
    }
    if (btn.dataset.filterTarget === "tailPanel") {
      count = getValuesFromInput(els.qIncludeSumTails).length + getValuesFromInput(els.qExcludeSumTails).length;
    }
    if (btn.dataset.filterTarget === "spanPanel") {
      count = getValuesFromInput(els.qIncludeSpans).length + getValuesFromInput(els.qExcludeSpans).length;
    }
    if (btn.dataset.filterTarget === "groupPanel") {
      count = getValuesFromInput(els.qIncludeGroups).length;
    }
    if (btn.dataset.filterTarget === "twoCodePanel") {
      count =
        getValuesFromInput(els.qIncludeTwoCodeCombos).length + getValuesFromInput(els.qExcludeTwoCodeCombos).length;
    }
    if (btn.dataset.filterTarget === "routePanel") {
      count = getValuesFromInput(els.qRoutes012).length;
    }
    if (btn.dataset.filterTarget === "bigPanel") {
      count = getValuesFromInput(els.qIncludeBigCounts).length + getValuesFromInput(els.qExcludeBigCounts).length;
    }
    if (btn.dataset.filterTarget === "oddPanel") {
      count = getValuesFromInput(els.qIncludeOddCounts).length + getValuesFromInput(els.qExcludeOddCounts).length;
    }
    btn.textContent = count > 0 ? `${label} ${count}` : label;
    btn.classList.toggle("has-value", count > 0);
  });
}

function setupRangeSelects() {
  document.querySelectorAll("select[data-range-min][data-range-max]").forEach((select) => {
    const current = select.value;
    const min = Number(select.dataset.rangeMin || "0");
    const max = Number(select.dataset.rangeMax || "0");
    const emptyText = select.dataset.emptyText || "不限";
    select.innerHTML = "";
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = emptyText;
    select.appendChild(empty);
    for (let value = min; value <= max; value += 1) {
      const option = document.createElement("option");
      option.value = String(value);
      option.textContent = String(value);
      select.appendChild(option);
    }
    select.value = current;
    select.addEventListener("change", updateQuickFilterButtons);
  });
}

function setupQuickPickers() {
  const pickers = document.querySelectorAll(".quick-picker");
  pickers.forEach((picker) => {
    const options = (picker.dataset.options || "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    const labels = (picker.dataset.optionLabels || "")
      .split(",")
      .map((v) => v.trim());

    const toolBar = document.createElement("div");
    toolBar.className = "quick-picker-tools";
    const actions = [
      { key: "all", text: "全选" },
      { key: "clear", text: "清空" },
      { key: "invert", text: "反选" }
    ];
    actions.forEach((action) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quick-picker-tool-btn";
      btn.dataset.action = action.key;
      btn.textContent = action.text;
      toolBar.appendChild(btn);
    });

    const grid = document.createElement("div");
    grid.className = `quick-picker-grid ${options.length <= 4 ? "small" : ""}`.trim();
    options.forEach((value, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quick-picker-option";
      btn.dataset.value = value;
      btn.textContent = labels[index] || value;
      grid.appendChild(btn);
    });

    picker.appendChild(toolBar);
    picker.appendChild(grid);

    picker.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLButtonElement)) return;

      const action = target.dataset.action;
      if (action) {
        const optionButtons = [...picker.querySelectorAll(".quick-picker-option")];
        if (action === "all") optionButtons.forEach((btn) => btn.classList.add("active"));
        if (action === "clear") optionButtons.forEach((btn) => btn.classList.remove("active"));
        if (action === "invert") {
          optionButtons.forEach((btn) => btn.classList.toggle("active"));
        }
        syncInputFromPicker(picker);
        return;
      }

      if (target.classList.contains("quick-picker-option")) {
        target.classList.toggle("active");
        syncInputFromPicker(picker);
      }
    });

    const inputId = picker.dataset.bindInput;
    const input = document.getElementById(inputId);
    if (input) {
      input.addEventListener("input", () => syncPickerFromInput(picker));
      syncPickerFromInput(picker);
    }
  });
}

function refreshAllQuickPickers() {
  document.querySelectorAll(".quick-picker").forEach((picker) => syncPickerFromInput(picker));
}

function clearPickerSelection(inputId) {
  const input = document.getElementById(inputId);
  if (input) input.value = "";
  document.querySelectorAll(`.quick-picker[data-bind-input="${inputId}"]`).forEach((picker) => {
    picker.querySelectorAll(".quick-picker-option.active").forEach((btn) => {
      btn.classList.remove("active");
    });
  });
}

function renderExcludeDigitButtons() {
  if (!els.excludeDigitsButtons) return;
  const buttons = els.excludeDigitsButtons.querySelectorAll(".digit-btn");
  buttons.forEach((btn) => {
    const digit = Number(btn.dataset.digit);
    btn.classList.toggle("active", excludedDigitsByButtons.has(digit));
  });
  updateQuickFilterButtons();
}

function resetVisibleFiltersAfterRun() {
  excludedDigitsByButtons.clear();
  renderExcludeDigitButtons();
  clearPickerSelection("includeDigits");
  clearPickerSelection("qExcludeSums");
  clearPickerSelection("qIncludeSumTails");
  clearPickerSelection("qExcludeSumTails");
  clearPickerSelection("qIncludeSpans");
  clearPickerSelection("qExcludeSpans");
  clearPickerSelection("qIncludeGroups");
  clearPickerSelection("qIncludeTwoCodeCombos");
  clearPickerSelection("qExcludeTwoCodeCombos");
  clearPickerSelection("qRoutes012");
  clearPickerSelection("qIncludeBigCounts");
  clearPickerSelection("qExcludeBigCounts");
  clearPickerSelection("qIncludeOddCounts");
  clearPickerSelection("qExcludeOddCounts");
  [els.qSumMin, els.qSumMax, els.qSpanMin, els.qSpanMax].forEach((select) => {
    if (select) select.value = "";
  });
  if (els.excludePair) els.excludePair.checked = false;
  if (els.excludeTriplet) els.excludeTriplet.checked = false;
  refreshAllQuickPickers();
  closeQuickFilterPanels();
  updateQuickFilterButtons();
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && item.issue && item.number);
  } catch {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyRecords));
}

function renderHistory() {
  els.historyCount.textContent = String(historyRecords.length);
  if (historyRecords.length === 0) {
    els.historyList.innerHTML = '<div class="history-empty">暂无历史记录</div>';
    return;
  }

  const html = historyRecords
    .map(
      (item, idx) => `
      <div class="history-item">
        <span>第 ${item.issue} 期：<strong>${item.number}</strong></span>
        <button class="mini-btn" data-remove-idx="${idx}">删除</button>
      </div>
    `
    )
    .join("");

  els.historyList.innerHTML = html;
}

function addHistoryRecord() {
  try {
    const issue = parseIssue(els.historyIssue.value);
    const number = parseThreeDigitNumber(els.historyNumber.value);
    const exists = historyRecords.some((item) => item.issue === issue);
    if (exists) {
      throw new Error(`第 ${issue} 期已存在`);
    }

    historyRecords.unshift({
      issue,
      number,
      createdAt: Date.now()
    });
    saveHistory();
    renderHistory();
    els.historyIssue.value = "";
    els.historyNumber.value = "";
  } catch (err) {
    alert(err.message || "新增历史记录失败");
  }
}

function removeHistoryRecord(idx) {
  if (idx < 0 || idx >= historyRecords.length) return;
  historyRecords.splice(idx, 1);
  saveHistory();
  renderHistory();
}

function clearHistory() {
  if (!historyRecords.length) return;
  const ok = confirm("确定清空全部历史记录吗？");
  if (!ok) return;
  historyRecords = [];
  saveHistory();
  renderHistory();
}

function getFilterSource() {
  const mode = els.sourceScope && els.sourceScope.value ? els.sourceScope.value : "full";
  if (mode === "full") return allNumbers();
  if (mode === "paste") {
    const raw = (els.customPool && els.customPool.value.trim()) || "";
    if (!raw) {
      throw new Error("已选「我粘贴的号码」：请先在顶部「号码粘贴区」大框里粘贴号码");
    }
    const parsed = parseCandidates(raw);
    if (parsed.length === 0) {
      throw new Error("粘贴内容解析后为空，请至少保留一个三位号码");
    }
    return parsed;
  }
  if (mode === "result") {
    const parsed = parseCandidates(els.result.value);
    if (parsed.length === 0) {
      if (els.sourceScope) els.sourceScope.value = "full";
      return allNumbers();
    }
    return parsed;
  }
  throw new Error("候选来源无效");
}

function run() {
  try {
    const config = buildConfig();
    const list = filterNumbers(getFilterSource(), config);
    rememberUndoState();
    els.count.textContent = String(list.length);
    els.result.value = list.join(", ");
    if (els.sourceScope && list.length > 0) els.sourceScope.value = "result";
    resetVisibleFiltersAfterRun();
    if (els.result && typeof els.result.scrollIntoView === "function") {
      const target = isMobileViewport() ? els.result.closest(".result-panel") : els.result;
      (target || els.result).scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  } catch (err) {
    if (els.count) els.count.textContent = "0";
    if (els.result) els.result.value = err.message || "输入格式有误，请检查后重试。";
  }
}

function reset() {
  rememberUndoState();
  excludedDigitsByButtons.clear();
  renderExcludeDigitButtons();
  clearPickerSelection("includeDigits");
  clearPickerSelection("qExcludeSums");
  clearPickerSelection("qIncludeSumTails");
  clearPickerSelection("qExcludeSumTails");
  clearPickerSelection("qIncludeSpans");
  clearPickerSelection("qExcludeSpans");
  clearPickerSelection("qIncludeGroups");
  clearPickerSelection("qIncludeTwoCodeCombos");
  clearPickerSelection("qExcludeTwoCodeCombos");
  clearPickerSelection("qRoutes012");
  clearPickerSelection("qIncludeBigCounts");
  clearPickerSelection("qExcludeBigCounts");
  clearPickerSelection("qIncludeOddCounts");
  clearPickerSelection("qExcludeOddCounts");
  [els.qSumMin, els.qSumMax, els.qSpanMin, els.qSpanMax].forEach((select) => {
    if (select) select.value = "";
  });
  if (els.excludeSums) els.excludeSums.value = "";
  if (els.includeSumTails) els.includeSumTails.value = "";
  if (els.excludeSumTails) els.excludeSumTails.value = "";
  if (els.sumMin) els.sumMin.value = "";
  if (els.sumMax) els.sumMax.value = "";
  if (els.spanMin) els.spanMin.value = "";
  if (els.spanMax) els.spanMax.value = "";
  if (els.patternType) els.patternType.value = "all";
  if (els.playMode) els.playMode.value = "direct";
  if (els.consecutiveType) els.consecutiveType.value = "all";
  if (els.excludePair) els.excludePair.checked = false;
  if (els.excludeTriplet) els.excludeTriplet.checked = false;
  refreshAllQuickPickers();
  els.count.textContent = "0";
  els.result.value = "";
  if (els.sourceScope) els.sourceScope.value = "full";
  alert("已重置所有筛选条件和结果");
}

function clearResultOnly() {
  rememberUndoState();
  els.count.textContent = "0";
  els.result.value = "";
  if (els.sourceScope) els.sourceScope.value = "full";
  alert("已清空结果。候选来源已切回「全部号码」，可重新筛选。");
}

if (els.runBtn) els.runBtn.addEventListener("click", run);
if (els.undoBtn) els.undoBtn.addEventListener("click", undoLastChange);
if (els.clearResultBtn) els.clearResultBtn.addEventListener("click", clearResultOnly);
if (els.resetBtn) els.resetBtn.addEventListener("click", reset);
if (els.clearCustomPoolBtn && els.customPool) {
  els.clearCustomPoolBtn.addEventListener("click", () => {
    els.customPool.value = "";
  });
}
document.querySelectorAll(".quick-filter-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.filterTarget;
    const target = targetId ? document.getElementById(targetId) : null;
    if (!target) return;
    const willOpen = target.hidden;
    closeQuickFilterPanels();
    target.hidden = !willOpen;
    btn.classList.toggle("active", willOpen);
  });
});
if (els.addHistoryBtn) els.addHistoryBtn.addEventListener("click", addHistoryRecord);
if (els.clearHistoryBtn) els.clearHistoryBtn.addEventListener("click", clearHistory);
if (els.excludeDigitsButtons) {
  els.excludeDigitsButtons.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const digitText = target.dataset.digit;
    if (digitText === undefined) return;
    const digit = Number(digitText);
    if (excludedDigitsByButtons.has(digit)) {
      excludedDigitsByButtons.delete(digit);
    } else {
      excludedDigitsByButtons.add(digit);
    }
    renderExcludeDigitButtons();
    updateQuickFilterButtons();
  });
}
if (els.historyList) {
  els.historyList.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const idxText = target.dataset.removeIdx;
    if (idxText === undefined) return;
    removeHistoryRecord(Number(idxText));
  });
}

historyRecords = loadHistory().sort((a, b) => Number(b.issue) - Number(a.issue));
setupRangeSelects();
setupQuickPickers();
refreshAllQuickPickers();
renderExcludeDigitButtons();
updateQuickFilterButtons();
renderHistory();

(function initBasicPanelOnMobile() {
  const basic = document.getElementById("basicPanel");
  if (basic && isMobileViewport()) basic.setAttribute("open", "");
})();

function syncPasteModeVisual() {
  const bar = document.getElementById("globalRunBar");
  if (!bar || !els.sourceScope) return;
  bar.classList.toggle("paste-mode-active", els.sourceScope.value === "paste");
}

if (els.sourceScope) {
  els.sourceScope.addEventListener("change", () => {
    syncPasteModeVisual();
    if (els.sourceScope.value === "paste" && els.customPool) {
      els.customPool.focus();
    }
  });
  syncPasteModeVisual();
}
