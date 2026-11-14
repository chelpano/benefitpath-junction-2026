const searchButton = document.getElementById("searchButton");
const userSituation = document.getElementById("userSituation");
const results = document.getElementById("results");
const apiBase = window.BENEFITPATH_API_BASE || "http://localhost:3000";

for (const chip of document.querySelectorAll(".prompt-chip")) {
    chip.addEventListener("click", () => {
        userSituation.value = chip.dataset.query || "";
        userSituation.removeAttribute("aria-invalid");
        userSituation.focus();
    });
}

userSituation.addEventListener("input", () => {
    if (userSituation.value.trim()) userSituation.removeAttribute("aria-invalid");
});

searchButton.addEventListener("click", async () => {
    const situation = userSituation.value.trim();

    if (!situation) {
        userSituation.setAttribute("aria-invalid", "true");
        showNotice("Tell us a little about your situation to get started.", "notice-error");
        userSituation.focus();
        return;
    }

    userSituation.removeAttribute("aria-invalid");
    searchButton.disabled = true;
    searchButton.classList.add("is-loading");
    searchButton.querySelector(".button-label").textContent = "Searching official sources…";
    results.replaceChildren();
    results.setAttribute("aria-busy", "true");

    const loadingMessage = document.createElement("p");
    loadingMessage.className = "loading-message";
    loadingMessage.setAttribute("role", "status");
    const loadingMark = document.createElement("span");
    loadingMark.className = "loading-mark";
    loadingMark.setAttribute("aria-hidden", "true");
    loadingMessage.append(loadingMark, document.createTextNode("Checking current Finnish guidance from official sources…"));
    results.appendChild(loadingMessage);

    try {
        const response = await fetch(`${apiBase}/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ situation })
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || "Search failed. Please try again.");

        results.replaceChildren();
        if (data.analysis) renderAnalysis(data.analysis);
        renderSources(Array.isArray(data.results) ? data.results : []);
    } catch (error) {
        results.replaceChildren();
        showNotice(error.message || "We couldn't complete that search. Please try again in a moment.", "notice-error", "We couldn't complete that search");
        console.error(error);
    } finally {
        searchButton.disabled = false;
        searchButton.classList.remove("is-loading");
        searchButton.querySelector(".button-label").textContent = "Find my next step";
        results.setAttribute("aria-busy", "false");
    }
});

function showNotice(message, className = "notice", title = "") {
    results.replaceChildren();
    const notice = document.createElement("div");
    notice.className = `notice ${className}`;
    notice.setAttribute("role", className.includes("error") ? "alert" : "status");
    if (title) {
        const heading = document.createElement("h2");
        heading.textContent = title;
        notice.appendChild(heading);
    }
    const text = document.createElement("p");
    text.textContent = message;
    notice.appendChild(text);
    results.appendChild(notice);
}

function renderAnalysis(analysis) {
    const section = document.createElement("section");
    section.className = "analysis-card";
    section.setAttribute("aria-labelledby", "analysis-title");

    const titleRow = document.createElement("div");
    titleRow.className = "results-title-row";
    const heading = document.createElement("h2");
    heading.id = "analysis-title";
    heading.textContent = "Your next steps";
    const label = document.createElement("span");
    label.className = "guidance-label";
    label.textContent = "Informational guidance";
    titleRow.append(heading, label);

    const text = document.createElement("div");
    text.className = "analysis-text";
    renderMarkdown(text, analysis);
    section.append(titleRow, text);
    results.appendChild(section);
}

function renderSources(sources) {
    const section = document.createElement("section");
    section.className = "sources-section";
    section.setAttribute("aria-labelledby", "sources-title");

    const headingRow = document.createElement("div");
    headingRow.className = "sources-heading";
    const heading = document.createElement("h2");
    heading.id = "sources-title";
    heading.textContent = "Sources behind this answer";
    const note = document.createElement("p");
    note.textContent = "Numbers match the citations in your summary.";
    headingRow.append(heading, note);
    section.appendChild(headingRow);

    if (sources.length === 0) {
        const message = document.createElement("div");
        message.className = "notice";
        message.textContent = "No official sources were found. Try adding a little more detail to your description.";
        section.appendChild(message);
        results.appendChild(section);
        return;
    }

    const list = document.createElement("div");
    list.className = "source-list";
    sources.forEach((item, index) => {
        const card = document.createElement("article");
        card.className = "result-card";

        const top = document.createElement("div");
        top.className = "source-card-top";
        const number = document.createElement("span");
        number.className = "source-index";
        number.textContent = `[${index + 1}]`;
        const title = document.createElement("h3");
        title.textContent = item.title || "Official source";
        top.append(number, title);

        const description = document.createElement("p");
        description.textContent = Array.isArray(item.highlights) && item.highlights.length
            ? item.highlights.join(" ")
            : "Open the official page to read the full guidance.";
        card.append(top, description);

        const safeUrl = getOfficialUrl(item.url);
        if (safeUrl) {
            const link = document.createElement("a");
            link.textContent = "Read original source";
            link.href = safeUrl;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            card.appendChild(link);
        }
        list.appendChild(card);
    });
    section.appendChild(list);
    results.appendChild(section);
}

function getOfficialUrl(value) {
    try {
        const url = new URL(value);
        const allowedDomains = ["kela.fi", "suomi.fi", "tyomarkkinatori.fi"];
        const isOfficial = allowedDomains.some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`));
        return url.protocol === "https:" && isOfficial ? url.href : "";
    } catch {
        return "";
    }
}

function renderMarkdown(container, markdown) {
    const inlinePattern = /(\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;
    const appendInline = (parent, text) => {
        let lastIndex = 0;
        for (const match of text.matchAll(inlinePattern)) {
            parent.append(document.createTextNode(text.slice(lastIndex, match.index)));
            let node;
            if (match[2] !== undefined) {
                node = document.createElement("strong");
                node.textContent = match[2];
            } else if (match[3] !== undefined) {
                node = document.createElement("em");
                node.textContent = match[3];
            } else if (match[4] !== undefined) {
                node = document.createElement("code");
                node.textContent = match[4];
            } else {
                node = document.createElement("a");
                node.textContent = match[5];
                node.href = match[6];
                node.target = "_blank";
                node.rel = "noopener noreferrer";
            }
            parent.append(node);
            lastIndex = match.index + match[0].length;
        }
        parent.append(document.createTextNode(text.slice(lastIndex)));
    };

    let paragraph = null;
    let list = null;
    const flushParagraph = () => {
        if (paragraph) container.append(paragraph);
        paragraph = null;
    };
    const flushList = () => {
        if (list) container.append(list);
        list = null;
    };

    for (const rawLine of String(markdown || "").split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) {
            flushParagraph();
            flushList();
            continue;
        }
        const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
        if (headingMatch) {
            flushParagraph();
            flushList();
            const heading = document.createElement(`h${Number(headingMatch[1].length) + 2}`);
            appendInline(heading, headingMatch[2]);
            container.append(heading);
            continue;
        }
        const itemMatch = line.match(/^(?:[-*•]|\d+[.)])\s+(.+)$/);
        if (itemMatch) {
            flushParagraph();
            if (!list) list = document.createElement("ul");
            const item = document.createElement("li");
            appendInline(item, itemMatch[1]);
            list.append(item);
            continue;
        }
        flushList();
        if (!paragraph) paragraph = document.createElement("p");
        else paragraph.append(document.createTextNode(" "));
        appendInline(paragraph, line);
    }
    flushParagraph();
    flushList();
}
