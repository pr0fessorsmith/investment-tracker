# Investment Tracker

A modern, secure investment tracking application built with Next.js, featuring Google Authentication, real-time portfolio analytics, and beautiful charts.

## 🚀 Features

- **🔐 Google OAuth Authentication** - Secure login with your Google account
- **📊 Portfolio Management** - Track multiple investments with detailed analytics
- **📈 Interactive Charts** - Beautiful visualizations of your investment performance
- **💹 Real-time Data** - Integration ready for Google Finance API
- **📱 Responsive Design** - Works perfectly on desktop and mobile
- **🌐 Easy Deployment** - Ready to deploy on Vercel, Netlify, or any hosting platform
- **🎯 Performance Tracking** - Track gains/losses, percentages, and portfolio allocation

## 🛠️ Technologies Used

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js with Google Provider
- **Charts**: Recharts
- **Icons**: Lucide React
- **Deployment**: Ready for Vercel/Netlify

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (version 18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

## 🚀 Quick Start

### 1. Install Node.js
If you don't have Node.js installed:
- Visit [nodejs.org](https://nodejs.org/)
- Download and install the LTS version
- Verify installation: `node --version` and `npm --version`

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
1. Copy the example environment file:
```bash
copy .env.example .env.local
```

2. Configure Google OAuth:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable Google+ API
   - Go to "Credentials" → "Create Credentials" → "OAuth client ID"
   - Choose "Web application"
   - Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
   - Copy Client ID and Client Secret to your `.env.local` file

3. Generate a NextAuth secret:
```bash
openssl rand -base64 32
```
Add this to `NEXTAUTH_SECRET` in your `.env.local` file.

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your investment tracker!

## 📖 Usage

1. **Sign In**: Use your Google account to securely sign in
2. **Add Investments**: Click "Add Investment" to input your stock purchases
3. **View Portfolio**: See your investments, current values, and performance
4. **Analyze Data**: Use the Analytics tab to view charts and trends

## 🔧 Configuration

### Google Finance Integration (Optional)
To get real-time stock prices, you can integrate with financial data APIs:
- Alpha Vantage
- Yahoo Finance API
- Finnhub
- IEX Cloud

Update the data fetching logic in the components to use your preferred API.

### Deployment Options

#### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy automatically

#### Netlify
1. Build the project: `npm run build`
2. Deploy the `out` folder to Netlify
3. Add environment variables in Netlify dashboard

#### Other Platforms
This is a standard Next.js application and can be deployed to any platform that supports Node.js.

## 📁 Project Structure

```
src/
├── app/
│   ├── api/auth/[...nextauth]/route.ts  # NextAuth configuration
│   ├── globals.css                      # Global styles
│   ├── layout.tsx                       # Root layout
│   └── page.tsx                         # Main page
├── components/
│   ├── auth/
│   │   └── AuthProvider.tsx             # Authentication provider
│   ├── Charts.tsx                       # Analytics charts
│   ├── InvestmentForm.tsx              # Add investment form
│   └── Portfolio.tsx                    # Portfolio overview
```

## 🔒 Security Features

- **Google OAuth**: Secure authentication without storing passwords
- **Session Management**: Secure session handling with NextAuth.js
- **Environment Variables**: Sensitive data stored securely
- **TypeScript**: Type safety throughout the application

## 🎯 Future Enhancements

- [ ] Real-time stock price updates
- [ ] Email notifications for price alerts
- [ ] Export portfolio data to CSV/PDF
- [ ] Multi-currency support
- [ ] Advanced portfolio analytics
- [ ] Mobile app version

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

If you encounter any issues:
1. Check the [Issues](../../issues) page
2. Create a new issue with detailed description
3. Include error messages and steps to reproduce

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for free hosting
- Google for OAuth services
- Tailwind CSS for beautiful styling
- Recharts for data visualization

---

**Happy Investing! 📈**
