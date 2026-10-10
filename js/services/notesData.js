/**
 * RASH EduHub - Comprehensive Course Notes Database & Data Provider
 * Stores structured lecture notes, cheat sheets, code snippets, and study guides for all courses.
 */

const COURSE_NOTES_DATA = {
   // Course 1: Complete Modern Web Development 2026
   'lesson_1': {
      courseTitle: 'Complete Modern Web Development 2026',
      lessonTitle: '01. HTML5 Semantic Layouts & Best Practices',
      category: 'Development',
      author: 'Harsh Singh',
      updatedAt: '2026-01-15',
      summary: 'Master semantic HTML5 element structure, document outline, accessibility (a11y) guidelines, and modern web page layout standards.',
      keyTakeaways: [
         'Semantic HTML improves search engine ranking (SEO) by clearly defining document structure.',
         'Use <main> exactly once per document to encapsulate primary content.',
         'Screen readers rely on structural tags like <nav>, <header>, <article>, and <aside> for page navigation.',
         'Avoid "div-soup" by replacing generic <div> containers with context-specific semantic elements.'
      ],
      content: `
         <h3>1. Introduction to HTML5 Semantic Layouts</h3>
         <p>Semantic HTML means using HTML markup to reinforce the human- and machine-readable <em>meaning</em> of content, rather than merely its presentation. Prior to HTML5, web layouts relied heavily on generic <code>&lt;div class="header"&gt;</code> tags. HTML5 introduced dedicated structural elements.</p>
         
         <div class="note-box note-tip">
            <strong>💡 Pro Tip:</strong> Always use structural elements according to their semantic purpose, not for default styling (e.g. font size or margins).
         </div>

         <h3>2. Core Semantic Elements Reference</h3>
         <ul>
            <li><code>&lt;header&gt;</code>: Represents introductory content, branding, search controls, or top-level navigation.</li>
            <li><code>&lt;nav&gt;</code>: Defines a block of major navigation links.</li>
            <li><code>&lt;main&gt;</code>: Contains the dominant content unique to the document body.</li>
            <li><code>&lt;article&gt;</code>: Represents a self-contained composition (blog post, news article, forum topic).</li>
            <li><code>&lt;section&gt;</code>: Groups related content under a common thematic heading.</li>
            <li><code>&lt;aside&gt;</code>: Contains indirectly related content (sidebars, author bio, related links).</li>
            <li><code>&lt;footer&gt;</code>: Contains copyright, contact info, sitemap links, or back-to-top buttons.</li>
         </ul>

         <h3>3. Standard HTML5 Page Template</h3>
         <p>Below is the recommended clean boilerplate for a modern HTML5 document:</p>
      `,
      codeSnippets: [
         {
            title: 'HTML5 Semantic Boilerplate',
            language: 'html',
            code: `<!DOCTYPE html>
<html lang="en">
<head>
   <meta charset="UTF-8">
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   <title>Modern Semantic Page</title>
   <link rel="stylesheet" href="css/style.css">
</head>
<body>

   <header class="site-header">
      <div class="logo">EduHub</div>
      <nav class="site-nav">
         <a href="#courses">Courses</a>
         <a href="#about">About</a>
         <a href="#contact">Contact</a>
      </nav>
   </header>

   <main class="content-container">
      <article class="primary-article">
         <h1>Mastering Semantic Web Design</h1>
         <p>Semantic markup makes the web accessible to everyone...</p>
      </article>

      <aside class="sidebar">
         <h3>Related Resources</h3>
         <ul>
            <li><a href="#">W3C HTML5 Specification</a></li>
            <li><a href="#">MDN Web Docs</a></li>
         </ul>
      </aside>
   </main>

   <footer class="site-footer">
      <p>&copy; 2026 RASH EduHub. All rights reserved.</p>
   </footer>

</body>
</html>`
         }
      ]
   },

   'lesson_2': {
      courseTitle: 'Complete Modern Web Development 2026',
      lessonTitle: '02. Modern CSS3 Flexbox & Glassmorphism Design',
      category: 'Development',
      author: 'Harsh Singh',
      updatedAt: '2026-01-18',
      summary: 'Deep dive into 1D layout alignment with CSS Flexbox and implementing state-of-the-art Glassmorphism UI components.',
      keyTakeaways: [
         'Flexbox operates on two axes: Main Axis (flex-direction) and Cross Axis.',
         'justify-content aligns items along the Main Axis, while align-items aligns along the Cross Axis.',
         'Glassmorphism is achieved using backdrop-filter: blur(), semi-transparent background colors, and subtle border highlights.',
         'Always provide fallback background colors for browsers that do not support backdrop-filter.'
      ],
      content: `
         <h3>1. Flexbox Layout Engine</h3>
         <p>Flexible Box Layout (Flexbox) is a 1-dimensional layout module designed for laying out, aligning, and distributing space among items in a container, even when their size is dynamic or unknown.</p>

         <h3>2. Key Container Properties</h3>
         <ul>
            <li><code>display: flex</code> — Activates flex context on direct children.</li>
            <li><code>flex-direction: row | column</code> — Defines the primary axis.</li>
            <li><code>justify-content: flex-start | center | space-between | space-around | space-evenly</code></li>
            <li><code>align-items: stretch | center | flex-start | flex-end</code></li>
            <li><code>gap: 1.5rem</code> — Defines spacing between flex items without margin collapse issues.</li>
         </ul>

         <h3>3. Modern Glassmorphism Styling System</h3>
         <p>Glassmorphism creates a frosted-glass visual effect with translucent surfaces layered over rich backdrops.</p>
      `,
      codeSnippets: [
         {
            title: 'Glassmorphism Card CSS',
            language: 'css',
            code: `.glass-card {
   /* Semi-transparent background */
   background: rgba(255, 255, 255, 0.75);
   
   /* Frosted glass blur effect */
   backdrop-filter: blur(16px);
   -webkit-backdrop-filter: blur(16px);

   /* Glass highlight border */
   border: 1px solid rgba(255, 255, 255, 0.3);
   border-radius: 1.6rem;

   /* Subtle elevation shadow */
   box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
   padding: 2.5rem;
   transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.glass-card:hover {
   transform: translateY(-5px);
   box-shadow: 0 12px 40px 0 rgba(31, 38, 135, 0.25);
}`
         }
      ]
   },

   'lesson_3': {
      courseTitle: 'Complete Modern Web Development 2026',
      lessonTitle: '03. JavaScript ES6+ Fundamentals & DOM Manipulation',
      category: 'Development',
      author: 'Harsh Singh',
      updatedAt: '2026-01-20',
      summary: 'Explore modern JavaScript features including arrow functions, destructuring, promises, async/await, and DOM API methods.',
      keyTakeaways: [
         'Use const by default for variables; use let only when re-assignment is explicitly required.',
         'Arrow functions lexically bind the value of "this".',
         'Destructuring syntax allows unpacking values from arrays or properties from objects into distinct variables.',
         'Async/await provides synchronous-like readability for asynchronous Promise-based operations.'
      ],
      content: `
         <h3>1. Modern Variable Declarations & Scope</h3>
         <p><code>const</code> creates block-scoped read-only references, while <code>let</code> allows block-scoped re-assignable variables. Avoid legacy <code>var</code> due to function-scoping and hoisting anomalies.</p>

         <h3>2. Asynchronous JavaScript & Fetch API</h3>
         <p>Asynchronous operations allow your program to initiate a task and continue running without blocking execution.</p>
      `,
      codeSnippets: [
         {
            title: 'Async Data Fetching & DOM Injection',
            language: 'javascript',
            code: `// Fetch course data asynchronously
async function loadCourses() {
   try {
      const response = await fetch('/api/courses');
      if (!response.ok) throw new Error(\`HTTP error! Status: \${response.status}\`);
      
      const data = await response.json();
      renderCourseGrid(data.courses);
   } catch (error) {
      console.error('Failed to fetch courses:', error);
   }
}

// Render into DOM
function renderCourseGrid(courses) {
   const container = document.querySelector('#courses-grid');
   if (!container) return;

   container.innerHTML = courses.map(c => \`
      <div class="glass-card">
         <h3>\${c.title}</h3>
         <p>\${c.description}</p>
         <span class="badge">\${c.category}</span>
      </div>
   \`).join('');
}`
         }
      ]
   },

   // Course 2: Advanced React & Next.js Full-Stack Masterclass
   'lesson_101': {
      courseTitle: 'Advanced React & Next.js Full-Stack Masterclass',
      lessonTitle: '01. Next.js 14 App Router Architecture',
      category: 'Development',
      author: 'Harsh Singh',
      updatedAt: '2026-02-01',
      summary: 'Understand Next.js 14 App Router layout trees, React Server Components (RSC), Client Components, and server actions.',
      keyTakeaways: [
         'Server Components render on the server, sending zero client-side JavaScript for improved performance.',
         'Add "use client" directive at the top of files that require browser APIs or React hooks (useState, useEffect).',
         'Layout components wrap pages and maintain state during route transitions.',
         'Server Actions allow direct async function calls from forms to server endpoints without writing boilerplate API routes.'
      ],
      content: `
         <h3>1. React Server Components (RSC) Paradigm</h3>
         <p>Next.js 14 defaults all components inside the <code>app/</code> directory to Server Components. Server Components fetch data directly from databases or backend services with zero waterfall delays.</p>

         <h3>2. App Router File Conventions</h3>
         <ul>
            <li><code>page.tsx</code> — Defines the unique UI for a route URL.</li>
            <li><code>layout.tsx</code> — Shared layout UI spanning child routes.</li>
            <li><code>loading.tsx</code> — Automated React Suspense fallback UI.</li>
            <li><code>error.tsx</code> — Automated React Error Boundary wrapper.</li>
         </ul>
      `,
      codeSnippets: [
         {
            title: 'Server Component with Data Fetching',
            language: 'jsx',
            code: `// Next.js 14 App Router Server Component
import { supabase } from '@/lib/supabase';

export default async function CoursesPage() {
   // Direct database query on server
   const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .order('enrolled_count', { ascending: false });

   if (error) return <div>Failed to load courses.</div>;

   return (
      <main className="container mx-auto p-6">
         <h1 className="text-3xl font-bold mb-6">All Courses</h1>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {courses.map(course => (
               <div key={course.id} className="glass-card">
                  <h2>{course.title}</h2>
                  <p>{course.description}</p>
               </div>
            ))}
         </div>
      </main>
   );
}`
         }
      ]
   },

   'lesson_102': {
      courseTitle: 'Advanced React & Next.js Full-Stack Masterclass',
      lessonTitle: '02. Supabase Authentication & Database Integration',
      category: 'Development',
      author: 'Harsh Singh',
      updatedAt: '2026-02-05',
      summary: 'Implement Supabase Auth, PostgreSQL schema design, Row Level Security (RLS) rules, and real-time database listeners.',
      keyTakeaways: [
         'Row Level Security (RLS) policies enforce database access control directly inside PostgreSQL.',
         'Supabase provides built-in JWT authentication with support for OAuth, magic links, and passwords.',
         'Use Supabase client libraries for seamless database queries and real-time socket subscriptions.'
      ],
      content: `
         <h3>1. Row Level Security (RLS) Principles</h3>
         <p>Instead of securing endpoints exclusively at the API layer, PostgreSQL RLS allows defining policies directly on tables to restrict read, insert, update, and delete access per user.</p>

         <h3>2. SQL RLS Policy Example</h3>
      `,
      codeSnippets: [
         {
            title: 'PostgreSQL Row Level Security Policy',
            language: 'sql',
            code: `-- Enable Row Level Security on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to read all public profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.users FOR SELECT 
USING (true);

-- Allow users to update only their own profile
CREATE POLICY "Users can update own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);`
         }
      ]
   },

   // Course 3: Data Structures & Algorithms in Java & C++
   'lesson_201': {
      courseTitle: 'Data Structures & Algorithms in Java & C++',
      lessonTitle: '01. Arrays, String Manipulation & Dynamic Memory',
      category: 'DSA',
      author: 'Harsh Singh',
      updatedAt: '2026-01-10',
      summary: 'Analyze Big O time and space complexities, array memory layouts, two-pointer techniques, and string sliding window patterns.',
      keyTakeaways: [
         'Arrays offer O(1) random access by index due to contiguous memory allocation.',
         'Two-pointer approach reduces quadratic O(N^2) brute force solutions to linear O(N).',
         'Strings are immutable in Java; use StringBuilder for efficient concatenation.'
      ],
      content: `
         <h3>1. Big O Complexity Analysis</h3>
         <p>Big O notation describes the upper bound of execution time or space requirement relative to input size <em>N</em>.</p>
         <ul>
            <li><strong>O(1)</strong> Constant: Array index lookup.</li>
            <li><strong>O(log N)</strong> Logarithmic: Binary search.</li>
            <li><strong>O(N)</strong> Linear: Unsorted array search.</li>
            <li><strong>O(N log N)</strong> Linearithmic: Merge sort, Quick sort.</li>
            <li><strong>O(N^2)</strong> Quadratic: Nested loops, Bubble sort.</li>
         </ul>
      `,
      codeSnippets: [
         {
            title: 'Two Pointer Technique (Java)',
            language: 'java',
            code: `public class TwoSumSorted {
    public static int[] twoSum(int[] numbers, int target) {
        int left = 0;
        int right = numbers.length - 1;

        while (left < right) {
            int sum = numbers[left] + numbers[right];
            if (sum == target) {
                return new int[]{left + 1, right + 1};
            } else if (sum < target) {
                left++;
            } else {
                right--;
            }
        }
        return new int[]{-1, -1};
    }
}`
         }
      ]
   },

   'lesson_202': {
      courseTitle: 'Data Structures & Algorithms in Java & C++',
      lessonTitle: '02. Linked Lists, Stacks & Queue Data Structures',
      category: 'DSA',
      author: 'Harsh Singh',
      updatedAt: '2026-01-12',
      summary: 'Master node pointer manipulation in Singly and Doubly Linked Lists, Stack LIFO operations, and Queue FIFO patterns.',
      keyTakeaways: [
         'Linked Lists provide O(1) insertion and deletion at known positions without memory shifting.',
         'Stacks operate on Last-In, First-Out (LIFO); ideal for call stack execution, undo mechanisms, and expression parsing.',
         'Queues operate on First-In, First-Out (FIFO); essential for task scheduling and BFS algorithms.'
      ],
      content: `
         <h3>1. Linked List Memory Architecture</h3>
         <p>Unlike arrays, linked list elements are non-contiguous in memory. Each node contains a data payload and a pointer reference to the next node.</p>
      `,
      codeSnippets: [
         {
            title: 'Reverse Linked List (C++)',
            language: 'cpp',
            code: `struct ListNode {
    int val;
    ListNode* next;
    ListNode(int x) : val(x), next(nullptr) {}
};

ListNode* reverseList(ListNode* head) {
    ListNode* prev = nullptr;
    ListNode* curr = head;

    while (curr != nullptr) {
        ListNode* nextTemp = curr->next;
        curr->next = prev;
        prev = curr;
        curr = nextTemp;
    }
    return prev;
}`
         }
      ]
   },

   'lesson_203': {
      courseTitle: 'Data Structures & Algorithms in Java & C++',
      lessonTitle: '03. Binary Search Trees & Graph Traversal (BFS & DFS)',
      category: 'DSA',
      author: 'Harsh Singh',
      updatedAt: '2026-01-14',
      summary: 'Understand Binary Search Tree invariants, preorder/inorder/postorder traversals, and Graph BFS vs DFS graph algorithms.',
      keyTakeaways: [
         'BST Property: For every node, left subtree values < node value < right subtree values.',
         'Inorder traversal of a BST yields elements in strictly sorted ascending order.',
         'Breadth-First Search (BFS) uses a Queue for level-order traversal; Depth-First Search (DFS) uses a Stack or Recursion.'
      ],
      content: `
         <h3>1. Graph Representation Strategies</h3>
         <p>Graphs consist of vertices (V) and edges (E). They are typically represented using an Adjacency Matrix (O(V^2) space) or an Adjacency List (O(V + E) space).</p>
      `,
      codeSnippets: [
         {
            title: 'Breadth-First Search (BFS) Graph Traversal in Java',
            language: 'java',
            code: `import java.util.*;

public class GraphBFS {
    public static void bfs(int startNode, List<List<Integer>> adj, boolean[] visited) {
        Queue<Integer> queue = new LinkedList<>();
        
        visited[startNode] = true;
        queue.add(startNode);

        while (!queue.isEmpty()) {
            int node = queue.poll();
            System.out.print(node + " ");

            for (int neighbor : adj.get(node)) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    queue.add(neighbor);
                }
            }
        }
    }
}`
         }
      ]
   },

   // Course 4: Python Data Science & Machine Learning Bootcamp
   'lesson_301': {
      courseTitle: 'Python Data Science & Machine Learning Bootcamp',
      lessonTitle: '01. Python Fundamentals & Data Structures',
      category: 'Python',
      author: 'Adarsh Sir',
      updatedAt: '2026-01-22',
      summary: 'Master Python lists, tuples, sets, dictionaries, list comprehensions, lambda expressions, and Object-Oriented Programming.',
      keyTakeaways: [
         'Python lists are mutable ordered sequences; tuples are immutable ordered sequences.',
         'Dictionaries provide O(1) hash map lookups by key.',
         'List comprehensions offer concise, idiomatic syntax for array transformations.'
      ],
      content: `
         <h3>1. Idiomatic Python & List Comprehensions</h3>
         <p>List comprehensions replace verbose for-loops when creating transformed lists.</p>
      `,
      codeSnippets: [
         {
            title: 'Python List Comprehensions & Lambda',
            language: 'python',
            code: `# Standard List Comprehension
numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
squares = [x**2 for x in numbers if x % 2 == 0]
print(squares)  # Output: [4, 16, 36, 64, 100]

# Dictionary Comprehension
word_lengths = {word: len(word) for word in ['python', 'data', 'science']}
print(word_lengths)  # Output: {'python': 6, 'data': 4, 'science': 7}`
         }
      ]
   },

   'lesson_302': {
      courseTitle: 'Python Data Science & Machine Learning Bootcamp',
      lessonTitle: '02. NumPy & Pandas for Data Manipulation',
      category: 'Python',
      author: 'Adarsh Sir',
      updatedAt: '2026-01-25',
      summary: 'Leverage vectorization with NumPy arrays and data cleaning, filtering, grouping, and aggregation using Pandas DataFrames.',
      keyTakeaways: [
         'NumPy array operations are implemented in C, enabling vectorized execution without Python loop overhead.',
         'Pandas DataFrames manage tabular data with indexed rows and named columns.',
         'Use .loc[] for label-based indexing and .iloc[] for integer-based indexing.'
      ],
      content: `
         <h3>1. Pandas Data Cleaning Workflow</h3>
         <p>Data cleaning involves handling missing values (NaN), removing duplicates, casting data types, and filtering outliers.</p>
      `,
      codeSnippets: [
         {
            title: 'Pandas Data Analysis & GroupBy',
            language: 'python',
            code: `import pandas as pd
import numpy as np

# Load dataset
df = pd.read_csv('student_data.csv')

# Data cleaning
df['score'] = df['score'].fillna(df['score'].median())
df['category'] = df['category'].astype('category')

# Aggregation & Analysis
summary = df.groupby('category').agg({
    'score': ['mean', 'max', 'count'],
    'study_hours': 'mean'
}).reset_index()

print(summary)`
         }
      ]
   },

   'lesson_303': {
      courseTitle: 'Python Data Science & Machine Learning Bootcamp',
      lessonTitle: '03. Scikit-Learn Machine Learning Models',
      category: 'Python',
      author: 'Adarsh Sir',
      updatedAt: '2026-01-28',
      summary: 'Train supervised machine learning algorithms including Linear Regression, Random Forests, and evaluate performance metrics.',
      keyTakeaways: [
         'Always split data into Training (e.g. 80%) and Test (e.g. 20%) sets to prevent overfitting.',
         'StandardScaler normalizes features to zero mean and unit variance.',
         'Use Classification Report (Precision, Recall, F1-Score) to evaluate imbalanced class predictions.'
      ],
      content: `
         <h3>1. Machine Learning Pipeline</h3>
         <p>Scikit-Learn estimators implement a unified API: <code>fit()</code> for training, <code>transform()</code> for feature scaling, and <code>predict()</code> for inference.</p>
      `,
      codeSnippets: [
         {
            title: 'Random Forest Classification Pipeline',
            language: 'python',
            code: `from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report

# Feature matrix X and target vector y
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Feature Scaling
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Model Training
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train_scaled, y_train)

# Model Evaluation
predictions = model.predict(X_test_scaled)
print(classification_report(y_test, predictions))`
         }
      ]
   },

   // Course 5: UI/UX Design Masterclass & Glassmorphism Systems
   'lesson_401': {
      courseTitle: 'UI/UX Design Masterclass & Glassmorphism Systems',
      lessonTitle: '01. Visual Hierarchy, Typography & Design Tokens',
      category: 'Design',
      author: 'SV Sir',
      updatedAt: '2026-02-10',
      summary: 'Master key UI layout principles: visual weight, typography scales, contrast ratios, and building cohesive design tokens.',
      keyTakeaways: [
         'Visual hierarchy guides the user eye to primary actions using size, weight, color, and spacing.',
         'Stick to 2 complementary typeface families per project (e.g. Outfit for Headings, Inter for Body).',
         'Design tokens centralize design decisions (colors, spacing, typography) into reusable variables.'
      ],
      content: `
         <h3>1. Principles of Visual Hierarchy</h3>
         <p>Visual hierarchy determines the sequence in which users process information on a screen.</p>
      `,
      codeSnippets: [
         {
            title: 'Design Tokens CSS Variables',
            language: 'css',
            code: `:root {
   /* Color Palette */
   --color-primary: #2563eb;
   --color-accent: #8b5cf6;
   --color-bg-dark: #0f172a;
   --color-text-main: #1e293b;
   
   /* Typography Tokens */
   --font-heading: 'Outfit', sans-serif;
   --font-body: 'Inter', sans-serif;
   --scale-h1: 3.2rem;
   --scale-h2: 2.4rem;
   
   /* Elevation & Glass Tokens */
   --glass-bg: rgba(255, 255, 255, 0.75);
   --glass-blur: 16px;
   --radius-card: 2rem;
}`
         }
      ]
   },

   'lesson_402': {
      courseTitle: 'UI/UX Design Masterclass & Glassmorphism Systems',
      lessonTitle: '02. Figma Prototyping & Modern Glassmorphism',
      category: 'Design',
      author: 'SV Sir',
      updatedAt: '2026-02-12',
      summary: 'Build interactive prototypes in Figma with Auto Layout 5.0, component variants, and modern frosted glass design tokens.',
      keyTakeaways: [
         'Auto Layout enables fluid component resizing responsive to content length.',
         'Use background blur (16px - 24px) combined with 1px semi-transparent borders for crisp glassmorphism cards.'
      ],
      content: `
         <h3>1. Figma Component Architecture</h3>
         <p>Structuring UI kits with reusable variants and auto-layout frames ensures speed and consistency during web application development.</p>
      `,
      codeSnippets: [
         {
            title: 'CSS Glass Button Component',
            language: 'css',
            code: `.btn-glass {
   background: rgba(37, 99, 235, 0.2);
   backdrop-filter: blur(12px);
   border: 1px solid rgba(255, 255, 255, 0.4);
   color: #ffffff;
   padding: 1.2rem 2.4rem;
   border-radius: 9999px;
   font-weight: 700;
   cursor: pointer;
   transition: all 0.25s ease;
}

.btn-glass:hover {
   background: rgba(37, 99, 235, 0.35);
   box-shadow: 0 8px 25px rgba(37, 99, 235, 0.4);
}`
         }
      ]
   },

   // Course 6: Full-Stack Node.js, Express & PostgreSQL Database Architecture
   'lesson_501': {
      courseTitle: 'Full-Stack Node.js, Express & PostgreSQL Database Architecture',
      lessonTitle: '01. Express REST API Design & Middleware',
      category: 'Development',
      author: 'Harsh Singh',
      updatedAt: '2026-02-15',
      summary: 'Architect scalable Express REST APIs using middleware pipelines, JWT auth guards, rate limiters, and centralized error handling.',
      keyTakeaways: [
         'Express middleware functions execute sequentially and can modify request/response objects or end the cycle.',
         'Always wrap asynchronous route handlers in try/catch blocks or use an async error wrapping utility.',
         'Implement CORS, rate-limiting, and security headers on production API instances.'
      ],
      content: `
         <h3>1. Express REST Architecture & Middleware Pipeline</h3>
         <p>Express routes process incoming HTTP requests through a pipeline of middleware handlers before returning JSON responses.</p>
      `,
      codeSnippets: [
         {
            title: 'Express REST Router Example',
            language: 'javascript',
            code: `const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// GET /api/courses
router.get('/', async (req, res, next) => {
   try {
      const courses = await Course.find();
      res.json({ success: true, count: courses.length, courses });
   } catch (err) {
      next(err);
   }
});

module.exports = router;`
         }
      ]
   },

   'lesson_502': {
      courseTitle: 'Full-Stack Node.js, Express & PostgreSQL Database Architecture',
      lessonTitle: '02. PostgreSQL Schema, Queries & Supabase Integration',
      category: 'Development',
      author: 'Harsh Singh',
      updatedAt: '2026-02-18',
      summary: 'Design normalized relational databases in PostgreSQL, write complex SQL JOINs, and integrate Supabase Node client.',
      keyTakeaways: [
         'Relational schema normalization reduces data redundancy and guarantees data integrity.',
         'PostgreSQL JSONB column type allows indexing and querying flexible semi-structured JSON data.',
         'Use database connection pooling in Node.js to manage database connections efficiently under heavy load.'
      ],
      content: `
         <h3>1. Relational Schema & Foreign Keys</h3>
         <p>Foreign keys enforce referential integrity between tables, ensuring orphaned records cannot exist without a valid parent key.</p>
      `,
      codeSnippets: [
         {
            title: 'PostgreSQL Schema & Indexes',
            language: 'sql',
            code: `CREATE TABLE IF NOT EXISTS courses (
   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
   title TEXT NOT NULL,
   description TEXT,
   tutor_id UUID REFERENCES users(id),
   category TEXT NOT NULL,
   playlists JSONB DEFAULT '[]'::jsonb,
   created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast category & tutor searches
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_tutor ON courses(tutor_id);`
         }
      ]
   }
};

/**
 * Course Notes Service Layer
 */
const CourseNotesService = {
   /**
    * Get notes for a specific lesson ID
    */
   getNotesByLessonId(lessonId) {
      if (!lessonId) return null;
      return COURSE_NOTES_DATA[lessonId] || null;
   },

   /**
    * Get all notes for a specific course ID or title
    */
   getNotesByCourseTitle(courseTitle) {
      if (!courseTitle) return [];
      return Object.entries(COURSE_NOTES_DATA)
         .filter(([_, note]) => note.courseTitle.toLowerCase() === courseTitle.toLowerCase())
         .map(([id, note]) => ({ id, ...note }));
   },

   /**
    * Get default fallback notes for any lesson title/id
    */
   getFallbackNotes(lessonTitle = 'Lecture Notes', courseTitle = 'Course Overview') {
      return {
         courseTitle,
         lessonTitle,
         category: 'General',
         author: 'RASH EduHub Instructor',
         updatedAt: new Date().toISOString().split('T')[0],
         summary: `Official study guide and cheat sheet for ${lessonTitle}. Key concepts, code samples, and reference guides.`,
         keyTakeaways: [
            `Understand core principles and structure of ${lessonTitle}.`,
            'Apply standard best practices and optimization patterns.',
            'Review code examples and test implementations in the interactive sandbox.'
         ],
         content: `
            <h3>Overview of ${lessonTitle}</h3>
            <p>This lecture covers essential concepts for <strong>${lessonTitle}</strong> in the <strong>${courseTitle}</strong> curriculum. Read through the summary, review key takeaways, and practice using the code examples provided.</p>
            
            <div class="note-box note-tip">
               <strong>💡 Study Recommendation:</strong> Practice writing and running the code snippets in the interactive sandbox to solidify your understanding.
            </div>

            <h3>Core Learning Objectives</h3>
            <ul>
               <li>Master key terminology and concepts.</li>
               <li>Understand runtime behavior and implementation steps.</li>
               <li>Avoid common syntax errors and architectural mistakes.</li>
            </ul>
         `,
         codeSnippets: [
            {
               title: 'Lecture Code Reference',
               language: 'javascript',
               code: `// ${lessonTitle} - Starter Code
function executeLessonTask() {
   console.log("Mastering ${lessonTitle} at RASH EduHub!");
}

executeLessonTask();`
            }
         ]
      };
   },

   /**
    * Get all available course notes entries
    */
   getAllNotes() {
      return COURSE_NOTES_DATA;
   }
};

if (typeof window !== 'undefined') {
   window.COURSE_NOTES_DATA = COURSE_NOTES_DATA;
   window.CourseNotesService = CourseNotesService;
}

if (typeof module !== 'undefined' && module.exports) {
   module.exports = { COURSE_NOTES_DATA, CourseNotesService };
}
