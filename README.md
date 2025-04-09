# FutureLens

A web-based interactive survey platform enabling participants to explore future-oriented questions, receive personalized feedback, and compare responses within cohorts.

## Features

- Anonymous and identifiable survey modes
- Offline functionality with localStorage backup
- Passcode authentication
- Custom scoring logic
- Responsive design for mobile, tablet, and desktop

## Tech Stack

- Vanilla JavaScript
- HTML5
- CSS3
- Supabase (Authentication, Database, Row-Level Security)
- Jest (Testing)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/futurelens.git
   cd futurelens
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server:
   ```bash
   npm start
   ```

### Running Tests

```bash
npm test
```

For watch mode:
```bash
npm run test:watch
```

## Project Structure

```
futurelens/
├── src/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   └── main.js
│   └── tests/
│       └── main.test.js
├── index.html
├── package.json
├── .babelrc
└── .gitignore
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License. 