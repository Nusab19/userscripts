// ==UserScript==
// @name         Udvash - Style Change
// @namespace    http://tampermonkey.net/
// @version      2025-08-29
// @description  Changes the dashboard links to a my preferred style.
// @author       Nusab Taha
// @match        https://online.udvash-unmesh.com/
// @match        https://online.udvash-unmesh.com/Dashboard
// @icon         https://www.google.com/s2/favicons?sz=64&domain=udvash-unmesh.com
// ==/UserScript==

const LINKS = {
    "Live Class": {
        href: "/Dashboard/LiveClass",
        icon: "fa-video",
        bgColor: "red-100",
        iconColor: "red-500"
    },
    "Past Class": {
        href: "/Routine/PastClasses",
        icon: "fa-folder-open",
        bgColor: "pink-100",
        iconColor: "pink-500"
    },
    "Live Exam": {
        href: "/Dashboard/LiveExam",
        icon: "fa-clock",
        bgColor: "green-100",
        iconColor: "green-500"
    },
    "Practice Exam": {
        href: "/Routine/PracticeExam",
        icon: "fa-clipboard-check",
        bgColor: "green-100",
        iconColor: "green-600"
    },
    "Solve Sheet": {
        href: "/Routine/QuestionAndSolveSheet",
        icon: "fa-file-alt",
        bgColor: "purple-100",
        iconColor: "purple-500"
    },
    "Q&A Service": {
        href: "/QnA/Course",
        icon: "fa-question-circle",
        bgColor: "blue-100",
        iconColor: "blue-500"
    },
    // "Course & Content": {
    //     href: "/Content/Index?id=2",
    //     icon: "fa-book",
    //     bgColor: "gray-100",
    //     iconColor: "gray-500"
    // }
};

function generateLinkElement(title, linkData) {
    return `
        <a href="${linkData.href}" class="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 bg-${linkData.bgColor} rounded-lg flex items-center justify-center">
                    <i class="fas ${linkData.icon} text-${linkData.iconColor}"></i>
                </div>
                <h3 class="font-medium text-gray-900">${title}</h3>
            </div>
            <i class="fas fa-chevron-right text-${linkData.iconColor}"></i>
        </a>
    `;
}

function generateContainer() {
    const linkElements = Object.entries(LINKS).map(([title, linkData]) =>
                                                   generateLinkElement(title, linkData)
                                                  ).join('');

    return `
        <div class="max-w-5xl p-5 rounded-lg bg-gray-200 mt-5 md:mt-10 mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            ${linkElements}
        </div>
    `;
}

(function() {
    'use strict';
    // create a host element inside the target
    const target = document.querySelector(".container.py-4.bg-shadow");
    if (target) {
        const host = document.createElement("div");
        target.innerHTML = ""; // clear old content
        target.className = "";
        target.appendChild(host);

        // attach shadow DOM
        const shadow = host.attachShadow({ mode: "open" });

        // inject Tailwind CSS
        const tailwind = document.createElement("link");
        tailwind.rel = "stylesheet";
        tailwind.href = "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css";
        shadow.appendChild(tailwind);

        // inject Font Awesome CSS
        const fa = document.createElement("link");
        fa.rel = "stylesheet";
        fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css";
        shadow.appendChild(fa);

        // inject your container HTML
        const wrapper = document.createElement("div");
        wrapper.innerHTML = generateContainer();
        shadow.appendChild(wrapper);
    }
})();
