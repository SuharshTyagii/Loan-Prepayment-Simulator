# 🏦 Loan Prepayment Simulator

**Live Demo**: [https://suharshtyagii.github.io/Loan-Prepayment-Simulator/](https://suharshtyagii.github.io/Loan-Prepayment-Simulator/)

A powerful, interactive tool to visualize how prepayments can transform your loan journey and save significant interest costs over time.

![Loan Prepayment Simulator Screenshot](https://via.placeholder.com/800x450)

## ✨ Features

- **Interactive Calculator**: See how changes to loan parameters affect your payoff timeline in real-time
- **Prepayment Analysis**: Visualize the impact of one-time and recurring prepayments
- **Multiple Payment Frequencies**: Simulate weekly, biweekly, monthly, semi-annual, and yearly payment schedules
- **Visual Amortization**: Interactive graph showing your loan balance reduction journey
- **Detailed Data**: Complete amortization schedule with period-by-period breakdown
- **Export Capability**: Download detailed amortization tables as CSV for further analysis
- **Multi-currency Support**: 30+ currencies with localized formatting
- **Responsive Design**: Seamless experience on desktop, tablet, and mobile devices
- **Dark/Light Mode**: Choose your preferred visual theme for comfort

## 🚀 Why Use This Tool?

Understanding how prepayments affect your loan can lead to significant savings. This simulator helps you:

- Visualize how years can be shaved off your loan term with strategic prepayments
- Calculate exact interest savings from different prepayment strategies
- Plan your financial future with interactive "what-if" scenarios
- Make informed decisions about where to allocate extra funds

## 📊 How It Works

The simulator uses standard amortization formulas to calculate how your loan balance changes over time. Key inputs include:

1. **Original loan amount**: The principal you initially borrowed
2. **Remaining principal**: Current outstanding balance
3. **Monthly EMI**: Your regular payment amount
4. **Interest rate**: Annual percentage rate
5. **Extra payments**: Both one-time lump sums and recurring additional payments

As you adjust these parameters, the calculator instantly updates the amortization schedule and visualization to show your new payoff trajectory.

## 🛠️ Technologies Used

- **React**: For building the interactive UI components
- **Recharts**: For data visualization
- **Tailwind CSS**: For responsive styling and dark/light mode
- **Lucide Icons**: For beautiful, consistent iconography

## 🧮 Mathematical Foundation

The simulator calculates loan amortization using the standard formula:

For each payment period:
1. Calculate interest: `Interest = Outstanding Balance × (Annual Rate ÷ Periods Per Year)`
2. Calculate principal payment: `Principal = Regular Payment + Extra Payment - Interest`
3. Update balance: `New Balance = Previous Balance - Principal Payment`

## 🔍 Use Cases

- **Home Mortgage Analysis**: See how additional payments can reduce your 30-year mortgage
- **Student Loan Planning**: Develop a strategy to eliminate student debt faster
- **Auto Loan Optimization**: Determine if making extra payments on your car loan makes financial sense
- **Personal Loan Management**: Visualize the quickest path to debt freedom

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

Created by Suharsh Tyagi

---

Made with ❤️ for everyone striving for financial freedom through informed decision-making.