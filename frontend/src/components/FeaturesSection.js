import React from "react";
import "../styles/App.css";

const features = [
  {
    title: "Secure Password Storage",
    description: "All your passwords are encrypted and stored securely, accessible only by you.",
    icon: "🔒"
  },
  {
    title: "Password Strength Meter",
    description: "Instantly see how strong your password is as you type, helping you create safer credentials.",
    icon: "💪"
  },
  {
    title: "Easy Access Anywhere",
    description: "Access your passwords from any device, anytime, with a simple and intuitive dashboard.",
    icon: "🌐"
  },
  {
    title: "Quick Search & Autofill",
    description: "Find and autofill your passwords in seconds, saving you time and effort.",
    icon: "⚡"
  },
  {
    title: "User-Friendly Interface",
    description: "Enjoy a clean, modern, and responsive design that makes password management a breeze.",
    icon: "✨"
  }
];

const FeaturesSection = () => (
  <section className="features-section">
    <h2 className="features-title">Why Choose Our Password Manager?</h2>
    <div className="features-list">
      {features.map((feature, idx) => (
        <div className="feature-card" key={idx}>
          <div className="feature-icon">{feature.icon}</div>
          <h3 className="feature-heading">{feature.title}</h3>
          <p className="feature-desc">{feature.description}</p>
        </div>
      ))}
    </div>
  </section>
);

export default FeaturesSection;