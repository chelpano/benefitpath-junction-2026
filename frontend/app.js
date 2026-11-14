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
        if (data.analysis) renderAnalysis(data.analysis, data.results || []);
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

function renderAnalysis(analysis, sources) {
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
    section.appendChild(titleRow);

    if (typeof analysis === "string") {
        const overview = document.createElement("p");
        overview.className = "guidance-summary";
        overview.textContent = cleanFallbackText(analysis);
        section.appendChild(overview);
        results.appendChild(section);
        return;
    }

    const overview = document.createElement("p");
    overview.className = "guidance-summary";
    overview.textContent = analysis.overview || "Here is the information I found in the official sources.";
    section.appendChild(overview);

    const grid = document.createElement("div");
    grid.className = "guidance-grid";

    if (Array.isArray(analysis.supportOptions) && analysis.supportOptions.length) {
        const block = createGuidanceBlock("Possible support options", "support-options-block");
        for (const option of analysis.supportOptions) {
            const card = document.createElement("article");
            card.className = "support-option";
            const title = document.createElement("h4");
            title.textContent = option.name;
            card.appendChild(title);
            appendLabeledParagraph(card, "Why it may fit", option.whyItMayFit);
            appendLabeledParagraph(card, "Who may qualify", option.whoMayQualify);
            appendLabeledParagraph(card, "Where to apply", option.whereToApply);
            appendCitationLinks(card, option.sourceIds, sources);
            block.appendChild(card);
        }
        grid.appendChild(block);
    }

    if (Array.isArray(analysis.eligibilityFactors) && analysis.eligibilityFactors.length) {
        const block = createGuidanceBlock("What can affect eligibility", "");
        const list = document.createElement("ul");
        list.className = "guidance-list";
        for (const factor of analysis.eligibilityFactors) {
            const item = document.createElement("li");
            const title = document.createElement("strong");
            title.textContent = factor.factor;
            item.append(title, document.createTextNode(` — ${factor.whyItMatters || "Check this requirement with the relevant authority."}`));
            appendCitationLinks(item, factor.sourceIds, sources);
            list.appendChild(item);
        }
        block.appendChild(list);
        grid.appendChild(block);
    }

    if (Array.isArray(analysis.missingInformation) && analysis.missingInformation.length) {
        const block = createGuidanceBlock("What we still need to know", "");
        const list = document.createElement("ul");
        list.className = "guidance-list";
        for (const question of analysis.missingInformation) {
            const item = document.createElement("li");
            item.textContent = question;
            list.appendChild(item);
        }
        block.appendChild(list);
        grid.appendChild(block);
    }

    if (Array.isArray(analysis.nextSteps) && analysis.nextSteps.length) {
        const block = createGuidanceBlock("Suggested next steps", "next-steps-block");
        const list = document.createElement("ol");
        list.className = "next-step-list";
        for (const [index, step] of analysis.nextSteps.entries()) {
            const item = document.createElement("li");
            item.className = "next-step-item";
            const number = document.createElement("span");
            number.className = "next-step-number";
            number.textContent = String(index + 1).padStart(2, "0");
            const copy = document.createElement("div");
            const title = document.createElement("strong");
            title.textContent = step.action;
            copy.appendChild(title);
            if (step.reason) {
                const reason = document.createElement("p");
                reason.textContent = step.reason;
                copy.appendChild(reason);
            }
            appendCitationLinks(copy, step.sourceIds, sources);
            item.append(number, copy);
            list.appendChild(item);
        }
        block.appendChild(list);
        grid.appendChild(block);
    }

    if (grid.children.length) section.appendChild(grid);
    const disclaimer = document.createElement("p");
    disclaimer.className = "answer-disclaimer";
    disclaimer.textContent = "This is general guidance, not an official eligibility decision. Check the linked sources or contact the relevant authority.";
    section.appendChild(disclaimer);
    results.appendChild(section);
}

function createGuidanceBlock(titleText, className) {
    const block = document.createElement("section");
    block.className = `guidance-block ${className}`.trim();
    const heading = document.createElement("h3");
    heading.textContent = titleText;
    block.appendChild(heading);
    return block;
}

function appendLabeledParagraph(parent, labelText, value) {
    if (!value) return;
    const paragraph = document.createElement("p");
    paragraph.className = "option-detail";
    const label = document.createElement("strong");
    label.textContent = `${labelText}: `;
    paragraph.append(label, document.createTextNode(value));
    parent.appendChild(paragraph);
}

function appendCitationLinks(parent, sourceIds, sources) {
    if (!Array.isArray(sourceIds) || !sourceIds.length) return;
    const citations = document.createElement("div");
    citations.className = "citation-links";
    for (const sourceId of sourceIds) {
        const source = sources[Number(sourceId) - 1];
        const url = getOfficialUrl(source?.url);
        if (!source || !url) continue;
        const link = document.createElement("a");
        link.className = "citation-link";
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = `Source ${sourceId} · ${source.title || "Official source"}`;
        link.title = source.title || `Official source ${sourceId}`;
        citations.appendChild(link);
    }
    if (citations.children.length) parent.appendChild(citations);
}

function cleanFallbackText(value) {
    return String(value || "")
        .replace(/\\([*_`#])/g, "$1")
        .replace(/^\s{0,3}#{1,6}\s*/gm, "")
        .replace(/\*\*(.*?)\*\*/g, "$1")
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/^\s*[-*•]\s+/gm, "")
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, "$1")
        .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
        .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
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
