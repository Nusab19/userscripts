// ==UserScript==
// @name         Udvash Style Change
// @namespace    http://tampermonkey.net/
// @version      2025-08-29
// @description  try to take over the world!
// @author       You
// @match        https://online.udvash-unmesh.com/
// @match        https://online.udvash-unmesh.com/Dashboard
// @icon         https://www.google.com/s2/favicons?sz=64&domain=udvash-unmesh.com
// @grant        none
// ==/UserScript==

const Container = `
<div class="max-w-5xl p-5 rounded-lg bg-gray-200 mt-5 md:mt-10 mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
    <a href="/Dashboard/LiveClass" class="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-video text-red-500"></i>
            </div>
            <h3 class="font-medium text-gray-900">Live Class</h3>
        </div>
        <i class="fas fa-chevron-right text-red-500"></i>
    </a>
    <a href="/Dashboard/LiveExam" class="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-clock text-green-500"></i>
            </div>
            <h3 class="font-medium text-gray-900">Live Exam</h3>
        </div>
        <i class="fas fa-chevron-right text-green-500"></i>
    </a>
    <a href="/Routine/PracticeExam" class="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-clipboard-check text-green-600"></i>
            </div>
            <h3 class="font-medium text-gray-900">Practice Exam</h3>
        </div>
        <i class="fas fa-chevron-right text-green-600"></i>
    </a>
    <a href="/Routine/QuestionAndSolveSheet" class="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-file-alt text-purple-500"></i>
            </div>
            <h3 class="font-medium text-gray-900">Solve Sheet</h3>
        </div>
        <i class="fas fa-chevron-right text-purple-500"></i>
    </a>
    <a href="/QnA/Course" class="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-question-circle text-blue-500"></i>
            </div>
            <h3 class="font-medium text-gray-900">Q&A Service</h3>
        </div>
        <i class="fas fa-chevron-right text-blue-500"></i>
    </a>
    <a href="/Content/Index?id=2" class="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
        <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-book text-orange-500"></i>
            </div>
            <h3 class="font-medium text-gray-900">Course & Content</h3>
        </div>
        <i class="fas fa-chevron-right text-orange-500"></i>
    </a>
</div>
`;

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
        wrapper.innerHTML = Container;
        shadow.appendChild(wrapper);
    }


})();
