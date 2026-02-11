@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --landing-bg: #ffffff;
    --landing-gradient-opacity: 1;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;

    --radius: 0.75rem;
    
    /* Liquid Glass Variables */
    --glass-blur: 20px;
    --glass-opacity: 0.03;
    --glass-border-opacity: 0.08;
    --glass-transition: all 0.5s cubic-bezier(0.2, 0, 0.2, 1);
  }

  .dark {
    --background: 0 0% 10%; /* #1a1a1a - dark grey */
    --foreground: 210 40% 98%;
    --landing-bg: #1a1a1a;
    --landing-gradient-opacity: 1;

    --card: 0 0% 12%; /* #1f1f1f */
    --card-foreground: 210 40% 98%;

    --popover: 0 0% 12%;
    --popover-foreground: 210 40% 98%;

    --primary: 221.2 83.2% 53.3%; /* Restored blue for consistency */
    --primary-foreground: 210 40% 98%;

    --secondary: 0 0% 20%;
    --secondary-foreground: 210 40% 98%;

    --muted: 0 0% 20%;
    --muted-foreground: 0 0% 65%;

    --accent: 0 0% 20%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 0 0% 20%;
    --input: 0 0% 20%;
    --ring: 0 0% 80%;

    /* Dark Liquid Glass Variables */
    --glass-opacity: 0.05;
    --glass-border-opacity: 0.1;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Global 90% Zoom Effect */
html {
  zoom: 0.9;
  -moz-transform: scale(0.9);
  -moz-transform-origin: 0 0;
}

@media screen and (min-width: 2560px) {
  html {
    zoom: 1; /* Reset zoom on very high res displays if needed */
  }
}

.liquid-glass {
  background: rgba(255, 255, 255, var(--glass-opacity));
  backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(180%);
  border: 1px solid rgba(255, 255, 255, var(--glass-border-opacity));
  box-shadow: 
    0 4px 24px -1px rgba(0, 0, 0, 0.1),
    inset 0 1px 1px 0 rgba(255, 255, 255, 0.05);
  transition: var(--glass-transition);
}

.dark .liquid-glass {
  background: rgba(255, 255, 255, var(--glass-opacity));
  border: 1px solid rgba(255, 255, 255, var(--glass-border-opacity));
  box-shadow: 
    0 10px 30px -10px rgba(0, 0, 0, 0.5),
    inset 0 1px 1px 0 rgba(255, 255, 255, 0.05);
}

.liquid-glass-card:hover {
  background: rgba(255, 255, 255, calc(var(--glass-opacity) + 0.03));
  border: 1px solid rgba(255, 255, 255, calc(var(--glass-border-opacity) + 0.04));
  box-shadow: 
    0 12px 40px -5px rgba(0, 0, 0, 0.15),
    inset 0 1px 1px 0 rgba(255, 255, 255, 0.08);
  transform: translateY(-2px);
}

.dark .liquid-glass-card:hover {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.dark .glass {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.hero-gradient {
  background: radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.1), transparent 50%),
              radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.05), transparent 50%),
              radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.05), transparent 50%);
}

/* Global Page Background */
.page-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  min-height: 100vh;
  z-index: 0;
  background-color: var(--landing-bg);
  pointer-events: none;
  overflow: hidden;
}

/* Base Gradient Style */
.gradient-blob {
  position: absolute;
  opacity: 0.8;
  transition: all 0.5s ease;
}

/* Landing Page Centered Gradient */
.landing-gradient {
  inset: 0;
  width: 100%;
  height: 100%;
}

/* Other Pages Top-Right Gradient */
.subpage-gradient {
  top: -10%;
  right: -10%;
  width: 60%;
  height: 60%;
  filter: blur(120px) saturate(180%);
}

/* Blue Theme Blobs (Original 4-Layer Spec) */
[data-gradient-theme='blue'] .gradient-blob,
.gradient-blue .gradient-blob {
  background-image:
    /* LAYER 1 – Warm bottom glow (orange/peach) */
    radial-gradient(
      120% 80% at 50% 88%,
      rgba(255, 196, 100, 0.85) 0%,
      rgba(255, 179, 138, 0.70) 24%,
      rgba(255, 127, 202, 0.35) 52%,
      rgba(255, 127, 202, 0.16) 68%,
      rgba(255, 127, 202, 0.00) 75%
    ),
    /* LAYER 2 – Magenta/pink mid bloom */
    radial-gradient(
      115% 90% at 52% 62%,
      rgba(255, 79, 216, 0.90) 0%,
      rgba(255, 127, 202, 0.60) 36%,
      rgba(255, 127, 202, 0.28) 58%,
      rgba(255, 127, 202, 0.00) 74%
    ),
    /* LAYER 3 – Cool core highlight (blue/azure) */
    radial-gradient(
      95% 70% at 52% 36%,
      rgba(154, 210, 255, 0.92) 0%,
      rgba(74, 163, 255, 0.75) 24%,
      rgba(138, 91, 255, 0.42) 48%,
      rgba(138, 91, 255, 0.16) 66%,
      rgba(138, 91, 255, 0.00) 74%
    ),
    /* LAYER 4 – Soft violet envelope */
    radial-gradient(
      140% 100% at 50% 70%,
      rgba(138, 91, 255, 0.22) 0%,
      rgba(138, 91, 255, 0.10) 42%,
      rgba(138, 91, 255, 0.00) 70%
    );
}

/* Pink Theme Blobs (Original Pink Spec) */
[data-gradient-theme='pink'] .gradient-blob,
.gradient-pink .gradient-blob {
  background-image: 
    radial-gradient(circle at center, rgba(255, 0, 128, 0.15) 0%, transparent 70%),
    radial-gradient(circle at 20% 20%, rgba(255, 100, 0, 0.05) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(147, 51, 234, 0.05) 0%, transparent 50%);
}

.dark .gradient-blob {
  filter: blur(140px) saturate(220%);
  opacity: 0.6;
}

@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}

.animate-float {
  animation: float 6s ease-in-out infinite;
}
