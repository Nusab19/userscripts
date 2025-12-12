// ==UserScript==
// @name         Udvash - Auto Load Practice Exams
// @namespace    http://tampermonkey.net/
// @version      2025-12-05
// @description  Automatically clicks the "Load More" button repeatedly until it disappears, then removes duplicates and unwanted elements
// @author       You
// @match      https://online.udvash-unmesh.com/Routine/PracticeExam*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=udvash-unmesh.com
// @grant        none
// ==/UserScript==

(function() {

    'use strict';
    document.querySelector(`[class="uu-main p-0 "]`)?.remove()
    // Global blacklist - exams containing these words will be ignored
    const BLACKLIST = ['bangla', 'biology', 'kha', 'gk', "agri"];

    // Store both filtered and unfiltered results
    let unfilteredExams = [];
    let filteredExams = [];

    // LocalStorage key
    const STORAGE_KEY = 'exam_data_cache';

    /**
 * Loads exam data from localStorage
 */
    function loadFromStorage() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                console.log(`📦 Loaded ${parsed.length} exams from cache`);
                return parsed;
            }
        } catch (err) {
            console.error('Error loading from localStorage:', err);
        }
        return [];
    }

    /**
 * Saves exam data to localStorage
 */
    function saveToStorage(exams) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(exams));
            console.log(`💾 Saved ${exams.length} exams to cache`);
        } catch (err) {
            console.error('Error saving to localStorage:', err);
            alert('Failed to save data to cache. Storage might be full.');
        }
    }

    /**
 * Checks if an exam already exists in cached data
 */
    function examExists(exam, cachedExams) {
        return cachedExams.some(cached =>
                                cached.examParams.examId === exam.examParams.examId &&
                                cached.examParams.routineId === exam.examParams.routineId
                               );
    }

    /**
 * Injects Tailwind CSS CDN into the page
 */
    function injectTailwindCSS() {
        if (!document.querySelector('script[src*="tailwindcss"]')) {
            const script = document.createElement('script');
            script.src = 'https://cdn.tailwindcss.com';
            document.head.appendChild(script);
            console.log('✅ Tailwind CSS CDN injected');
        }
    }

    /**
 * Creates and shows progress indicator in bottom right (fixed position)
 */
    function createProgressIndicator() {
        const progress = document.createElement('div');
        progress.id = 'exam-fetch-progress';
        progress.style.cssText = 'position: fixed; bottom: 1rem; right: 1rem; z-index: 9999; min-width: 200px;';
        progress.innerHTML = `
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); padding: 1rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem;">
                <div style="width: 1.25rem; height: 1.25rem; border: 2px solid #e5e7eb; border-top-color: #2563eb; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                <div style="font-weight: 600; font-size: 0.875rem; color: #111827;">Fetching exams...</div>
            </div>
            <div style="font-size: 0.75rem; color: #6b7280; line-height: 1.5;">
                <div>Page Number: <span id="progress-page" style="font-weight: 600; color: #111827;">0</span></div>
                <div>Total Exams: <span id="progress-total" style="font-weight: 600; color: #111827;">0</span></div>
            </div>
        </div>
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
    `;
        document.body.appendChild(progress);
        return progress;
    }

    /**
 * Updates progress indicator
 */
    function updateProgress(pageNumber, totalExams) {
        const pageEl = document.getElementById('progress-page');
        const totalEl = document.getElementById('progress-total');
        if (pageEl) pageEl.textContent = pageNumber;
        if (totalEl) totalEl.textContent = totalExams;
    }

    /**
 * Shows error in progress indicator
 */
    function showError(message) {
        const progress = document.getElementById('exam-fetch-progress');
        if (progress) {
            progress.innerHTML = `
            <div style="background: #fee2e2; border: 1px solid #fecaca; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); padding: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                    <svg style="width: 1.25rem; height: 1.25rem; color: #dc2626;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div style="font-weight: 600; font-size: 0.875rem; color: #991b1b;">Error</div>
                </div>
                <div style="font-size: 0.75rem; color: #7f1d1d;">${message}</div>
            </div>
        `;
        }
    }

    /**
 * Shows success message in progress indicator
 */
    function showSuccess(filteredCount, totalCount) {
        const progress = document.getElementById('exam-fetch-progress');
        if (progress) {
            progress.innerHTML = `
            <div style="background: #dcfce7; border: 1px solid #bbf7d0; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); padding: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem;">
                    <svg style="width: 1.25rem; height: 1.25rem; color: #16a34a;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div style="font-weight: 600; font-size: 0.875rem; color: #166534;">Complete!</div>
                </div>
                <div style="font-size: 0.75rem; color: #14532d; line-height: 1.5;">
                    <div>Filtered: <span style="font-weight: 600;">${filteredCount}</span></div>
                    <div>Total: <span style="font-weight: 600;">${totalCount}</span></div>
                </div>
            </div>
        `;
        }
    }

    /**
 * Removes progress indicator
 */
    function removeProgress() {
        const progress = document.getElementById('exam-fetch-progress');
        if (progress) {
            progress.remove();
        }
    }

    /**
 * Downloads data as JSON file
 */
    function downloadJSON(data, filename) {
        try {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to download JSON:', err);
            alert('Failed to download file. Check console for details.');
        }
    }

    /**
 * Creates download buttons at top right
 */
    function createDownloadButtons() {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'position: fixed; top: 1rem; right: 1rem; display: flex; gap: 0.5rem; z-index: 9999;';
        buttonContainer.innerHTML = `
        <button id="force-refresh"
                style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background-color: #dc2626; color: white; font-size: 0.875rem; font-weight: 500; border-radius: 0.375rem; border: none; cursor: pointer; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); transition: background-color 0.15s;"
                onmouseover="this.style.backgroundColor='#b91c1c'"
                onmouseout="this.style.backgroundColor='#dc2626'"
                title="Force refresh all data from server">
            <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Force Refresh
        </button>
        <button id="download-filtered"
                style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background-color: #2563eb; color: white; font-size: 0.875rem; font-weight: 500; border-radius: 0.375rem; border: none; cursor: pointer; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); transition: background-color 0.15s;"
                onmouseover="this.style.backgroundColor='#1d4ed8'"
                onmouseout="this.style.backgroundColor='#2563eb'">
            <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download Filtered
        </button>
        <button id="download-all"
                style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background-color: #4b5563; color: white; font-size: 0.875rem; font-weight: 500; border-radius: 0.375rem; border: none; cursor: pointer; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); transition: background-color 0.15s;"
                onmouseover="this.style.backgroundColor='#374151'"
                onmouseout="this.style.backgroundColor='#4b5563'">
            <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download All
        </button>
    `;
        document.body.appendChild(buttonContainer);

        // Add event listeners with error handling
        document.getElementById('force-refresh').addEventListener('click', async () => {
            try {
                if (confirm('This will fetch all exams from the server again. Continue?')) {
                    console.log('🔄 Force refreshing data...');

                    // Clear existing content and buttons
                    const mainContainer = document.querySelector('.uu-main.p-0') ||
                          document.querySelector('.max-w-7xl');
                    if (mainContainer) {
                        mainContainer.remove();
                    }

                    // Re-run the main fetch with force refresh
                    await runExamFetcher(true);
                }
            } catch (err) {
                console.error('Failed to force refresh:', err);
                alert('Failed to refresh data. Check console for details.');
            }
        });

        document.getElementById('download-filtered').addEventListener('click', () => {
            try {
                if (!filteredExams || filteredExams.length === 0) {
                    alert('No filtered exams to download. Please wait for data to load.');
                    return;
                }
                downloadJSON(filteredExams, 'exams-filtered.json');
                console.log('✅ Downloaded filtered exams');
            } catch (err) {
                console.error('Failed to download filtered exams:', err);
                alert('Failed to download filtered exams. Check console for details.');
            }
        });

        document.getElementById('download-all').addEventListener('click', () => {
            try {
                if (!unfilteredExams || unfilteredExams.length === 0) {
                    alert('No exams to download. Please wait for data to load.');
                    return;
                }
                downloadJSON(unfilteredExams, 'exams-all.json');
                console.log('✅ Downloaded all exams');
            } catch (err) {
                console.error('Failed to download all exams:', err);
                alert('Failed to download all exams. Check console for details.');
            }
        });
    }

    /**
 * Parses exam card HTML structure into a structured object array
 * @param {string} htmlString - The HTML string containing exam cards
 * @param {boolean} applyFilter - Whether to apply blacklist filter
 * @returns {Array} Array of parsed exam objects
 */
    function parseExamCards(htmlString, applyFilter = true) {
        try {
            // Create a temporary DOM element to parse the HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlString, 'text/html');

            // Get all exam card elements
            const examCards = doc.querySelectorAll('.exam-item');

            // Helper function to check if text contains any blacklisted word
            const containsBlacklistedWord = (text) => {
                const lowerText = text.toLowerCase();
                return BLACKLIST.some(word => lowerText.includes(word.toLowerCase()));
            };

            // Parse each card into a structured object
            const exams = Array.from(examCards).map(card => {
                // Helper function to safely get text content
                const getText = (selector, parent = card) => {
                    const element = parent.querySelector(selector);
                    return element ? element.textContent.trim() : '';
                };

                // Helper function to get attribute value
                const getAttr = (selector, attr, parent = card) => {
                    const element = parent.querySelector(selector);
                    return element ? element.getAttribute(attr) : '';
                };

                // Parse the exam link to extract query parameters
                const examLink = getAttr('.app-btn-take-exam', 'href');
                const urlParams = new URLSearchParams(examLink.split('?')[1] || '');

                return {
                    // Basic info
                    title: getText('.uuu-wrap-title'),
                    type: getText('.badge'),
                    subjectName: getText('.subject-name'),

                    // Date and time
                    dateTime: getText('.date-time h6 b'),

                    // Duration
                    duration: getText('.duration h6 b'),

                    // Course information
                    course: {
                        name: getText('.duration strong'),
                        program: getText('.duration span')
                    },

                    // Status
                    status: getText('.not-taken'),
                    hasTaken: !card.querySelector('.not-taken'),

                    // Exam link and parameters
                    examLink: examLink,
                    examParams: {
                        courseId: urlParams.get('courseId'),
                        routineId: urlParams.get('routineId'),
                        examId: urlParams.get('examId'),
                        studentProgramId: urlParams.get('studentProgramId')
                    }
                };
            });

            if (!applyFilter) {
                return exams;
            }

            return exams.filter(exam => {
                // Filter out exams that contain any blacklisted word in title, course name, or program
                const textToCheck = `${exam.title} ${exam.course.name} ${exam.course.program}`;
                return !containsBlacklistedWord(textToCheck);
            });
        } catch (err) {
            console.error('Error parsing exam cards:', err);
            throw new Error(`Failed to parse exam cards: ${err.message}`);
        }
    }

    /**
 * Fetches all exam pages and returns parsed exam data
 * @param {boolean} forceRefresh - If true, ignores cache and fetches all data
 * @returns {Promise<Object>} Object containing filtered and unfiltered exams
 */
    async function fetchAllExams(forceRefresh = false) {
        const cachedExams = forceRefresh ? [] : loadFromStorage();
        const allExamsUnfiltered = [...cachedExams];
        const allExamsFiltered = [];
        let pageNumber = 1;
        let hasMorePages = true;
        let consecutiveCachedPages = 0;

        console.log(forceRefresh ? "🔄 Force refreshing all exams..." : "Starting to fetch exams...");
        if (cachedExams.length > 0 && !forceRefresh) {
            console.log(`📦 Starting with ${cachedExams.length} cached exams`);
        }

        const progressEl = createProgressIndicator();

        while (hasMorePages) {
            try {
                updateProgress(pageNumber, allExamsUnfiltered.length);
                console.log(`Fetching page ${pageNumber}...`);

                const response = await fetch("https://online.udvash-unmesh.com/Routine/LoadExamRoutineAjax", {
                    method: "POST",
                    headers: {
                        "accept": "*/*",
                        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "x-requested-with": "XMLHttpRequest"
                    },
                    referrer: "https://online.udvash-unmesh.com/Routine/PracticeExam",
                    body: `courseId=0&subjectId=&portalExamType=&isPracticeExamPage=true&pageNumber=${pageNumber}`,
                    credentials: "include"
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status} - ${response.statusText}`);
                }

                const html = await response.text();

                // Check if we've reached the end (NO EXAM FOUND message)
                if (html.includes("NO EXAM FOUND")) {
                    console.log(`No more exams found at page ${pageNumber}. Stopping.`);
                    hasMorePages = false;
                    break;
                }

                // Parse the exams from this page (unfiltered only for cache check)
                const pageExamsUnfiltered = parseExamCards(html, false);

                if (!forceRefresh) {
                    // Check if all exams on this page already exist in cache
                    const allExamsCached = pageExamsUnfiltered.every(exam => examExists(exam, cachedExams));

                    if (allExamsCached && pageExamsUnfiltered.length > 0) {
                        consecutiveCachedPages++;
                        console.log(`Page ${pageNumber}: All exams already cached (${consecutiveCachedPages} consecutive cached pages)`);

                        // If we've seen 2 consecutive pages that are fully cached, stop fetching
                        if (consecutiveCachedPages >= 2) {
                            console.log('✅ All new exams fetched (2 consecutive cached pages detected)');
                            hasMorePages = false;
                            break;
                        }
                    } else {
                        consecutiveCachedPages = 0;

                        // Add only new exams to our list
                        const newExams = pageExamsUnfiltered.filter(exam => !examExists(exam, allExamsUnfiltered));
                        allExamsUnfiltered.push(...newExams);
                        console.log(`Page ${pageNumber}: Found ${newExams.length} new exams`);
                    }
                } else {
                    // Force refresh: add all exams
                    allExamsUnfiltered.push(...pageExamsUnfiltered);
                    console.log(`Page ${pageNumber}: Found ${pageExamsUnfiltered.length} exams`);
                }

                updateProgress(pageNumber, allExamsUnfiltered.length);
                pageNumber++;

                // Add a small delay to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (err) {
                console.error(`Error fetching page ${pageNumber}:`, err);
                showError(`Failed at page ${pageNumber}: ${err.message}`);

                // Wait longer before removing error
                setTimeout(() => removeProgress(), 5000);
                throw err;
            }
        }

        // Save all unfiltered exams to localStorage
        saveToStorage(allExamsUnfiltered);

        // Now apply filtering for display
        allExamsFiltered.push(...parseExamCards(
            allExamsUnfiltered.map(exam => `<div class="exam-item">${JSON.stringify(exam)}</div>`).join(''),
            false
        ));

        // Apply blacklist filter manually since we're working with objects
        const filteredResults = allExamsUnfiltered.filter(exam => {
            const textToCheck = `${exam.title} ${exam.course.name} ${exam.course.program}`;
            const lowerText = textToCheck.toLowerCase();
            return !BLACKLIST.some(word => lowerText.includes(word.toLowerCase()));
        });

        // Show success message
        showSuccess(filteredResults.length, allExamsUnfiltered.length);

        // Keep success visible for 3 seconds before removing
        setTimeout(() => removeProgress(), 3000);

        console.log(`\nTotal exams: ${filteredResults.length} (filtered), ${allExamsUnfiltered.length} (all)`);
        return { filtered: filteredResults, unfiltered: allExamsUnfiltered };
    }

    /**
 * Renders exam cards to the DOM
 * @param {Array} exams - Array of exam objects to render
 */
    function renderExams(exams) {
        try {
            // Remove the old content
            const mainContainer = document.querySelector('.uu-main.p-0');
            if (mainContainer) {
                mainContainer.remove();
                console.log("✅ Removed old content");
            }

            // Create new container
            const newContainer = document.createElement('div');
            newContainer.className = 'max-w-7xl mx-auto px-4 py-6';
            newContainer.innerHTML = `
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-900">Available Exams</h1>
                <p class="text-sm text-gray-500 mt-1">${exams.length} exams ready to take</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" id="exam-cards-container"></div>
        `;

            // Insert into body or main content area
            const contentArea = document.querySelector('main') || document.querySelector('.content') || document.body;
            contentArea.appendChild(newContainer);

            // Get the cards container
            const cardsContainer = document.getElementById('exam-cards-container');

            if (!cardsContainer) {
                throw new Error('Failed to create cards container');
            }

            // Generate cards for each exam
            exams.forEach((exam, index) => {
                try {
                    const card = document.createElement('div');
                    card.className = 'group';

                    card.innerHTML = `
                    <div class="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow h-full flex flex-col">
                        <div class="p-4 border-b border-gray-100">
                            <div class="flex items-start justify-between gap-2 mb-2">
                                <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-blue-50 text-blue-700">
                                    ${exam.type || 'Exam'}
                                </span>
                                ${exam.hasTaken ? '<span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-green-50 text-green-700">Done</span>' : ''}
                            </div>
                            <h3 class="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight">
                                ${exam.title || 'Untitled Exam'}
                            </h3>
                        </div>

                        <div class="p-4 flex-1 space-y-3 text-xs">
                            <div class="flex items-start gap-2">
                                <svg class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                    <div class="font-medium text-gray-700">Duration</div>
                                    <div class="text-gray-500">${exam.duration || 'N/A'}</div>
                                </div>
                            </div>

                            <div class="flex items-start gap-2">
                                <svg class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <div>
                                    <div class="font-medium text-gray-700">Available</div>
                                    <div class="text-gray-500">${exam.dateTime || 'N/A'}</div>
                                </div>
                            </div>

                            <div class="flex items-start gap-2">
                                <svg class="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <div>
                                    <div class="font-medium text-gray-700">${exam.course?.name || 'Unknown Course'}</div>
                                    <div class="text-gray-500">${exam.course?.program || ''}</div>
                                </div>
                            </div>
                        </div>

                        <div class="p-4 pt-0">
                            <a href="${exam.examLink || '#'}"
                               class="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                   exam.hasTaken
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }">
                                ${exam.hasTaken ? 'Review Exam' : 'Take Exam'}
                            </a>
                        </div>
                    </div>
                `;

                    cardsContainer.appendChild(card);
                } catch (err) {
                    console.error(`Error rendering exam card ${index}:`, err);
                }
            });

            console.log(`✅ Rendered ${exams.length} exam cards`);
        } catch (err) {
            console.error('Error rendering exams:', err);
            throw new Error(`Failed to render exams: ${err.message}`);
        }
    }

    /**
 * Main fetcher function
 */
    async function runExamFetcher(forceRefresh = false) {
        try {
            const exams = await fetchAllExams(forceRefresh);

            // Store in global variables
            filteredExams = exams.filtered;
            unfilteredExams = exams.unfiltered;
            window.allExams = filteredExams;
            window.allExamsUnfiltered = unfilteredExams;

            console.log("\n=== RESULTS ===");
            console.log(`Filtered exams: ${filteredExams.length}`);
            console.log(`All exams: ${unfilteredExams.length}`);
            console.log("\n✅ Data saved to window.allExams (filtered) and window.allExamsUnfiltered");

            // Create download buttons (only once)
            if (!document.getElementById('download-filtered')) {
                createDownloadButtons();
            }

            // Render the filtered exams to the DOM
            renderExams(filteredExams);

        } catch (err) {
            console.error("Failed to fetch exams:", err);
            showError(err.message || 'An unexpected error occurred');

            // Keep error visible longer
            setTimeout(() => removeProgress(), 5000);
        }
    }

    // Main execution
    (async () => {
        try {
            // Inject Tailwind CSS first
            injectTailwindCSS();

            // Wait a bit for Tailwind to load
            await new Promise(resolve => setTimeout(resolve, 500));

            // Run the fetcher
            await runExamFetcher(false);

        } catch (err) {
            console.error("Failed to initialize:", err);
            showError(err.message || 'An unexpected error occurred');

            // Keep error visible longer
            setTimeout(() => removeProgress(), 5000);
        }
    })();



})();
