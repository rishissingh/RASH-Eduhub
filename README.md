# RASH EduHub

RASH EduHub is a modern, responsive educational platform front-end designed to provide a seamless learning experience. It serves as a user interface for a Course Management or Learning Management System (LMS), where students can browse courses, watch video tutorials, interact with teachers, and manage their profiles.

## 🏗️ Architecture and Technologies

The project is built using a clean, static front-end architecture, ensuring fast load times and easy maintainability.

### Tech Stack
* **HTML5**: For semantically structuring the web pages.
* **CSS3**: For styling, responsive layouts (CSS Grid/Flexbox), and providing a modern user interface.
* **JavaScript (Vanilla)**: For handling user interactions, DOM manipulation, sidebar toggling, and dynamic theme switching (e.g., dark mode).
* **Font Awesome**: Used extensively for iconography across the platform.

### Working Mechanism
Since this is a static frontend, the working of the project relies on HTML pages linked together to simulate a full-fledged web application flow:
1. **Entry Point**: The user starts at `index.html` (Home page) which showcases quick options, popular topics, top categories, and featured courses.
2. **Navigation**: A persistent header and a collapsible sidebar allow users to navigate between different modules:
   * **Home (`index.html`)**: Dashboard overview.
   * **About (`about.html`)**: Information about the platform.
   * **Courses (`courses.html`)**: A catalog of available courses.
   * **Teachers (`teachers.html`)**: A list of tutors and educators on the platform.
   * **Contact Us (`contact.html`)**: A form for users to reach out to administrators.
   * **Creator Studio (`creator.html`)**: An interface intended for content creators to manage their content.
3. **Course Consumption**:
   * Users can view a specific course playlist (`playlist.html`).
   * Selecting a video takes them to the video player page (`watch-video.html`).
4. **User Authentication & Management**:
   * Forms are provided for logging in (`login.html`) and registering (`register.html`).
   * Users can view their profile (`profile.html`) and update their details (`update.html`).

## 📂 Project Structure

* `/` (Root directory): Contains all the HTML templates representing different views.
* `/css/`: Contains `style.css` which houses the global styles, responsive media queries, and component-specific styling.
* `/js/`: Contains modular JavaScript files (`script.js`, `home.js`, `courses.js`, etc.) that control the interactive elements of specific pages.
* `/images/`: Stores all static image assets such as user avatars, course thumbnails, and background images.

## 🚀 How to Run Locally

Since this project does not rely on a backend server or complex build tools, running it is straightforward:

1. **Clone or Download** the repository to your local machine.
2. Navigate to the project folder.
3. Simply double-click on `index.html` to open it in your default web browser.
4. *(Optional but Recommended)*: For the best experience and to prevent CORS issues if you add fetch requests later, use a local server like the **Live Server** extension in VS Code.

## 🧠 Engagement Tracker
This project includes a standalone Python-based desktop engagement tracker under `ai-services/engagement-tracker/`.

### Prerequisites
* Install Python 3.10+ and ensure `python` or `py` works from the command line.
* Install dependencies:
  * `pip install -r ai-services/engagement-tracker/requirements.txt`

### Run the tracker
From the project root:
```bash
python ai-services/engagement-tracker/tracker.py --camera 0
```

### Test camera attachment
To probe the selected camera index and exit after reporting status:
```bash
python ai-services/engagement-tracker/tracker.py --camera 0 --test-camera
```

## 🎨 Features
* Fully responsive design that works on mobile, tablet, and desktop.
* Interactive sidebar menu.
* Light and Dark mode toggle functionality.
* Clean and consistent UI design with modern cards, grids, and typography.
