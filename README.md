# Caffeine Craze ☕

**Caffeine Craze** is a complete web application for a coffee shop. It allows customers to browse a menu, manage a shopping cart, register/login to their accounts, place orders, and view their order history. The application is built with vanilla JavaScript, HTML, CSS, and Bootstrap, and is powered by **Firebase** for backend services (Authentication and Firestore Database).

## 🚀 Features

* **Home Page**: A welcoming landing page featuring the cafe's story, best sellers, and contact information.
* **Interactive Menu**: Browse a variety of coffee drinks and snacks with images, descriptions, prices, and ratings.
* **Shopping Cart**:
    * Add items to cart with a single click.
    * Adjust quantities or remove items.
    * Real-time total calculation.
    * Cart data persists using `localStorage`.
* **User Authentication**:
    * Secure Login and Registration using **Firebase Auth**.
    * Support for Email/Password and Google Sign-In.
    * Password validation and error handling.
* **Checkout System**:
    * Delivery address form (Home/Office/Other).
    * Order summary review before confirmation.
    * Orders are saved directly to the database.
* **User Profile**:
    * View personal account details.
    * **Order History**: Track past orders with status, items, and total cost, fetched dynamically from Firestore.

## 🛠️ Tech Stack

* **Frontend**: HTML5, CSS3, JavaScript (ES6+ modules).
* **Styling**: Bootstrap 5.3.3, Custom CSS, Google Fonts ("Dancing Script", "Edu AU VIC WA NT Hand").
* **Backend / BaaS**:
    * **Firebase Authentication**: User management.
    * **Cloud Firestore**: NoSQL database for storing user profiles and orders.
    * **Firebase Analytics**: Site usage tracking.

## 📂 Project Structure

* **`index.html`**: The main landing page.
* **`product.html`**: The menu page where users can browse and add items to the cart.
* **`spa.html`**: The authentication hub handling Login and Register views.
* **`proceed_button.html`**: The Cart and Checkout page.
* **`profile.html`**: The user dashboard displaying account info and order history.
* **`js/`**:
    * `spa.js`: Handles authentication logic and UI toggling.
    * `cart.js`: Manages cart state (add/remove/update) and localStorage.
    * `firestore.js`: Handles database operations (saving orders, fetching history).

## ⚙️ Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/your-username/caffeine-craze.git](https://github.com/your-username/caffeine-craze.git)
    cd caffeine-craze
    ```

2.  **Serve the application:**
    Since the project uses JavaScript Modules, you must use a local server.

    * **VS Code Users:** Install the "Live Server" extension, right-click `index.html`, and select "Open with Live Server".
    * **Node.js Users:**
        ```bash
        npx serve .
        ```

3.  **Firebase Configuration:**
    The project is pre-configured with Firebase credentials. Ensure you have an active internet connection to communicate with the Firebase servers.

## 📄 License

This project is available for educational purposes.

