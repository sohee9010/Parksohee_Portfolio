// ===================================
// Enhanced Interactive Features
// ===================================

// ===================================
// Reactive Sphere & Mouse Speed Identity
// ===================================

const glassSphere = document.getElementById('glassSphere');
// Theme click interaction removed as per request.

// 2. Magnetic Glow (Light Source following Mouse)
const heroSection = document.querySelector('.hero');

if (heroSection) {
  heroSection.addEventListener('mousemove', (e) => {
    // Get mouse position relative to center of screen
    const x = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2); // -1 to 1
    const y = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2); // -1 to 1

    // Set CSS variables for the glare movement
    // We limit the range to avoid the light goig off the sphere too much
    heroSection.style.setProperty('--light-x', x.toFixed(2));
    heroSection.style.setProperty('--light-y', y.toFixed(2));
  });
}

// Ensure 'breathe-float' animation is running in CSS (~8s infinite alternate)
// This serves as the "2. Breathing Float" part of the request.


// Scroll Progress Indicator (Keep existing)
const scrollProgress = document.createElement('div');
scrollProgress.className = 'scroll-progress';
scrollProgress.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: linear-gradient(90deg, #0071E3, #5E5CE6);
  z-index: 9999;
  transition: width 0.1s ease;
`;
document.body.appendChild(scrollProgress);

window.addEventListener('scroll', () => {
  const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
  const scrolled = (window.scrollY / windowHeight) * 100;
  scrollProgress.style.width = scrolled + '%';
});

// ===================================
// Navigation & Scroll
// ===================================
const navbar = document.getElementById('navbar');
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');
const navLinks = document.querySelectorAll('.nav-link');

// Mobile Menu
if (navToggle) {
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
    navToggle.classList.toggle('active');
  });
}

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    if (navMenu) navMenu.classList.remove('active');
    if (navToggle) navToggle.classList.remove('active');
  });
});

// Navbar Scroll Effect (Optimized with RequestAnimationFrame)
let isScrolling = false;

window.addEventListener('scroll', () => {
  if (!isScrolling) {
    window.requestAnimationFrame(() => {
      handleScroll();
      isScrolling = false;
    });
    isScrolling = true;
  }
});

function handleScroll() {
  if (navbar) {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }
  updateActiveLink();
}

// Active Link Update
const cachedSections = document.querySelectorAll('section'); // Cache once

function updateActiveLink() {
  const sections = cachedSections.length ? cachedSections : document.querySelectorAll('section'); // Fallback
  const scrollPosition = window.scrollY + 100;

  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;
    const sectionId = section.getAttribute('id');

    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
          link.classList.add('active');
        }
      });
    }
  });
}

// ===================================
// Scroll Animations (Intersection Observer)
// ===================================
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target); // Only animate once
    }
  });
}, observerOptions);

const fadeElements = document.querySelectorAll('.fade-in, .section-header, .project-card, .skill-row, .reveal-text');
fadeElements.forEach((el, index) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'all 0.8s cubic-bezier(0.215, 0.61, 0.355, 1)';
  // Stagger delay based on index within its group if needed, or simple delay
  // el.style.transitionDelay = `${index % 3 * 0.1}s`; 
  observer.observe(el);
});

// ===================================
// Identity Tab Switcher (About <-> Skills)
// ===================================
window.switchIdentityTab = function (tabName) {
  // 1. Update Tabs
  const tabs = document.querySelectorAll('.identity-tab');
  tabs.forEach(tab => tab.classList.remove('active'));

  // Find the button that was clicked
  const activeBtn = document.querySelector(`.identity-tab[onclick*="'${tabName}'"]`);
  if (activeBtn) activeBtn.classList.add('active');

  // 2. Update Content
  const contents = document.querySelectorAll('.identity-content');
  contents.forEach(content => {
    content.classList.remove('active');
    content.style.display = 'none'; // Ensure hidden
  });

  const target = document.getElementById(`tab-${tabName}`);
  if (target) {
    target.style.display = 'block';
    // Small delay to allow display:block to apply before opacity transition
    setTimeout(() => {
      target.classList.add('active');
    }, 10);
  }

  // 3. Layout Control (Hide Image on Skills Tab)
  const aboutVisual = document.querySelector('.about-visual');
  const aboutLayout = document.querySelector('.about-layout');

  if (tabName === 'skills') {
    if (aboutVisual) aboutVisual.style.display = 'none';
    if (aboutLayout) aboutLayout.classList.add('full-width');
  } else {
    // Show image for 'intro' or others
    if (aboutVisual) aboutVisual.style.display = 'flex'; // Restore flex display
    if (aboutLayout) aboutLayout.classList.remove('full-width');
  }
}

// ===================================
// Form Handling (Formspree Integration)
// ===================================
function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;

      // Show loading state
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
      submitBtn.disabled = true;

      try {
        // Submit to Formspree
        const formData = new FormData(contactForm);
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });


        if (response.ok) {
          // Success feedback - Purple Glass Style
          submitBtn.innerHTML = '<i class="fas fa-check"></i> Sent!';
          submitBtn.style.background = 'rgba(127, 82, 255, 0.35)';
          submitBtn.style.borderColor = 'rgba(127, 82, 255, 0.6)';
          submitBtn.style.color = '#FFFFFF';
          submitBtn.style.boxShadow = '0 12px 30px rgba(127, 82, 255, 0.3)';

          // Show toast notification
          showContactToast('메시지가 전송되었습니다! 곧 연락드리겠습니다.');

          // Reset form
          contactForm.reset();

          // Reset button after 3 seconds
          setTimeout(() => {
            submitBtn.innerHTML = originalText;
            submitBtn.style.background = '';
            submitBtn.style.borderColor = '';
            submitBtn.style.color = '';
            submitBtn.style.boxShadow = '';
            submitBtn.disabled = false;
          }, 3000);
        } else {
          throw new Error('Form submission failed');
        }
      } catch (error) {
        // Error feedback - Subtle Red Glass
        submitBtn.innerHTML = '<i class="fas fa-times"></i> Failed';
        submitBtn.style.background = 'rgba(239, 68, 68, 0.2)';
        submitBtn.style.borderColor = 'rgba(239, 68, 68, 0.4)';
        submitBtn.style.color = '#EF4444';
        showContactToast('전송 실패. 다시 시도해주세요.');

        setTimeout(() => {
          submitBtn.innerHTML = originalText;
          submitBtn.style.background = '';
          submitBtn.style.borderColor = '';
          submitBtn.style.color = '';
          submitBtn.disabled = false;
        }, 3000);
      }
    });
  }
}

// Toast Notification for Contact Form
function showContactToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast-notification';
  toast.innerHTML = `
    <i class="fas fa-check-circle"></i>
    <span>${message}</span>
  `;
  toast.style.cssText = `
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: rgba(16, 185, 129, 0.95);
    color: white;
    padding: 16px 24px;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    gap: 12px;
    font-weight: 600;
    z-index: 10000;
    animation: slideInRight 0.3s ease;
  `;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Add toast animations to styles
const toastStyleSheet = document.createElement('style');
toastStyleSheet.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(toastStyleSheet);

// Console Easter Egg
console.log('%c Developed by Your Name ', 'background: #3B82F6; color: #fff; border-radius: 3px; padding: 5px; font-weight: bold;');

// ===================================
// Typewriter Effect
// ===================================
const typewriterElement = document.getElementById('typewriter-text');
const phrases = ["Web & Mobile", "Creative", "Problem Solving"];
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typeSpeed = 100;

let lastTime = 0;
let accumulatedTime = 0;
let animationFrameId;

function typeWriter(currentTime) {
  if (!typewriterElement) return;

  if (!lastTime) lastTime = currentTime;
  const deltaTime = currentTime - lastTime;
  lastTime = currentTime;
  accumulatedTime += deltaTime;

  // Process logic only if enough time has passed
  if (accumulatedTime >= typeSpeed) {
    accumulatedTime = 0; // Reset timer

    const currentPhrase = phrases[phraseIndex];

    if (isDeleting) {
      // FLASHCARD STYLE: Instant delete
      typewriterElement.textContent = '';
      charIndex = 0;
      isDeleting = false;
      phraseIndex = (phraseIndex + 1) % phrases.length;
      typeSpeed = 200; // Small pause before typing next
    } else {
      // Typing logic
      typewriterElement.textContent = currentPhrase.substring(0, charIndex + 1);
      charIndex++;
      typeSpeed = 50; // Fast typing speed

      if (charIndex === currentPhrase.length) {
        // Finished typing phrase
        isDeleting = true;
        typeSpeed = 1500; // View time (1.5 seconds)
      }
    }
  }

  animationFrameId = requestAnimationFrame(typeWriter);
}

function startTypingLoop() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);
  animationFrameId = requestAnimationFrame(typeWriter);
}

// ===================================
// Project Data
// ===================================
const projectData = {
  1: {
    category: "game",
    title: "너구리 요괴의 대탈출 :<br>3D Interactive Web Game",
    modalTitleColor: "#FB8C00",
    subtitle: "웹캠 제스처 인식 기반 인터랙티브 게임",
    image: "images/A_cinematic_3d_202601141039_doi8b.mp4",
    period: "2024.09 - 2024.11",
    team: "개인 프로젝트",
    role: "기획, 디자인, 풀스택 개발",
    status: "완료",
    description: "별도의 컨트롤러 없이 사용자의 웹캠 제스처(Hand Gesture)를 실시간으로 인식하여 캐릭터를 조작하는 3D 인터랙티브 게임입니다. 기존의 키보드/마우스 입력 방식을 탈피하여, CSS 3D와 Motion Recognition API를 활용한 몰입형 경험을 구현했습니다.",
    features: [
      "웹캠 기반 실시간 핸드 제스처 인식 시스템",
      "CSS 3D Transform을 활용한 입체적 공간 구현",
      "별도 장비 없는 몰입형 게임 플레이 경험",
      "사용자 동작에 반응하는 실시간 피드백 루프",
      "최적화된 모션 인식 알고리즘 적용"
    ],
    techStack: ["JavaScript", "CSS3", "Webcam API", "Motion Recognition"],
    challenges: "실시간 영상 처리로 인한 브라우저 성능 저하가 주된 문제였습니다. 연산 로직을 Web Worker로 분리하고 인식 주기를 최적화하여 60FPS를 유지했습니다.",
    results: "하드웨어 제약 없는 새로운 인터랙션 방식을 제시했으며, 창의적인 웹 기술 활용 능력을 입증했습니다.",
    github: "https://github.com/sohee9010",
    video: "https://o365daejin-my.sharepoint.com/personal/20221325_office_daejin_ac_kr/_layouts/15/stream.aspx?id=%2Fpersonal%2F20221325%5Foffice%5Fdaejin%5Fac%5Fkr%2FDocuments%2F%ED%95%91%EA%BE%B8%EA%B3%B5%EB%93%80%5F%EA%B2%8C%EC%9E%84%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8%2FKDT%5F1%EC%B0%A8%EA%B2%8C%EC%9E%84%5F%EC%8B%9C%EC%97%B0%EC%98%81%EC%83%81%2Emp4&nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&ga=1&referrer=StreamWebApp%2EWeb&referrerScenario=AddressBarCopied%2Eview%2E5064a36c%2D7647%2D438b%2Db19f%2Db96fb96f173c",
    report: "https://o365daejin-my.sharepoint.com/personal/20221325_office_daejin_ac_kr/_layouts/15/onedrive.aspx?id=%2Fpersonal%2F20221325%5Foffice%5Fdaejin%5Fac%5Fkr%2FDocuments%2F%ED%95%91%EA%BE%B8%EA%B3%B5%EB%93%80%5F%EA%B2%8C%EC%9E%84%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8&ga=1",
    imagePosition: "center top",
    images: [
      "images/project_1.PNG",
      "images/project_1-1.png",
      "images/project_1-2.png",
      "images/project1-3.mp4"
    ]
  },
  2: {
    category: "web",
    title: "고급형 백화점 통합 관리 플랫폼 : <br> Premium Department Store",
    modalTitleColor: "#333333",
    subtitle: "고급형 백화점 통합 관리 플랫폼",
    image: "images/제목 없는 비디오 - Clipchamp로 제작.mp4",
    period: "2024.06 - 2024.08",
    team: "팀 프로젝트 (4명)",
    role: "프론트엔드 리드",
    status: "완료",
    description: "다양한 브랜드와 카테고리를 취급하는 고급형 백화점 쇼핑몰을 구현했습니다. 일반적인 구매 프로세스뿐만 아니라, 관리자(Admin) 페이지를 통해 상품 입점부터 재고, 회원 등급까지 관리하는 통합 웹 플랫폼을 구축했습니다.",
    features: [
      "브랜드 및 카테고리별 상품 큐레이션",
      "장바구니, 결제, 주문 내역 조회 프로세스",
      "관리자 대시보드 (입점, 재고, 매출 관리)",
      "회원 등급제 및 포인트 시스템",
      "반응형 웹 디자인 적용"
    ],
    techStack: ["React", "Node.js", "Redux", "MongoDB"],
    challenges: "복잡한 상품 옵션과 재고 연동 로직을 처리하는 것이 까다로웠습니다. Redux를 활용한 체계적인 상태 관리로 데이터 무결성을 확보했습니다.",
    results: "실제 커머스 운영이 가능한 수준의 완성도 높은 플랫폼을 구축했습니다.",
    github: "https://github.com/sohee9010/shopping-mall-website.git",
    demo: "https://shopping-mall-website.vercel.app/",
    images: [
      "images/project_2.jpg",
      "images/project_2-1.png",
      "images/project_2-2.png",
      "images/project_2-3.png",
      "images/project_2-4.png",
      "images/project_2-5.png",
      "images/project_2-6.png"
    ]
  },
  3: {
    category: "game",
    title: "STEP UP : Cross-Device Rhythm Game",
    modalTitleColor: "#0288D1",
    subtitle: "스마트폰 센서 연동 크로스 디바이스 게임",
    image: "images/project_3.png",
    period: "2024.03 - 2024.05",
    team: "팀 프로젝트 (3명)",
    role: "풀스택 개발, 소켓 통신 구현",
    status: "완료",
    description: "스마트폰을 게임 컨트롤러로 사용하여 PC 화면에서 플레이하는 크로스 디바이스(Cross-Device) 리듬 게임입니다. 모바일의 자이로/가속도 센서(Motion Sensor) 데이터를 실시간으로 PC에 전송하는 소켓 통신(Socket.io) 기술을 구현하여, 별도의 장비 없이도 생생한 체감형 플레이가 가능하도록 개발했습니다.",
    features: [
      "Socket.io 기반 실시간 기기 간 통신 (PC-Mobile)",
      "모바일 자이로/가속도 센서 데이터 정밀 제어",
      "다양한 난이도와 비트맵 노트 시스템",
      "지연 시간(Latency) 최소화 로직 적용"
    ],
    techStack: ["Socket.io", "Node.js", "Mobile Sensor API", "HTML5"],
    challenges: "네트워크 환경에 따른 통신 지연이 게임 경험을 저해했습니다. 타임스탬프 동기화와 예측 보정 알고리즘으로 싱크 오차를 최소화했습니다.",
    results: "웹 기술만으로 콘솔 게임과 유사한 사용자 경험을 제공하는 데 성공했습니다.",
    github: "https://github.com/sohee9010",
    demo: "https://sohee9010.github.io/rhythm-game-website/",
    imagePosition: "center 20%",
    images: [
      "images/project_3.png",
      "images/project_3-1.png",
      "images/project_3-2.mp4"
    ]
  },
  4: {
    category: "mobile",
    title: "플랜더(Plander) : <br>Future Planning Calendar",
    modalTitleColor: "#f2cec5",
    subtitle: "만다라트 기법 기반 목표 달성 앱",
    image: "images/project_4.png",
    period: "2023.12 - 2024.02",
    team: "개인 프로젝트",
    role: "안드로이드 앱 개발",
    status: "완료",
    description: "만다라트(Mandalart) 기법을 모바일 환경에 최적화하여 구현한 안드로이드 기반 자기계발 앱입니다. 핵심 목표를 64개의 세부 실천 계획으로 확장하는 로직을 설계하였으며, 이를 캘린더(Calendar) 일정과 유기적으로 연동하여 미래 설계(Future Planning)와 일상 관리가 동시에 가능한 통합 솔루션을 구축했습니다.",
    features: [
      "만다라트 기법 시각화 및 편집 UI",
      "일정 관리 캘린더 연동 시스템",
      "목표 달성률 추적 및 통계 제공",
      "직관적인 Material Design UI 적용"
    ],
    techStack: ["Android Studio", "Kotlin", "SQLite", "Material Design"],
    challenges: "복잡한 만다라트 데이터 구조와 캘린더 데이터의 효율적인 연동이 과제였습니다. Room Database의 관계형 설계를 통해 데이터 일관성을 유지했습니다.",
    results: "체계적인 목표 관리를 돕는 실용적인 앱으로 완성되었습니다.",
    github: "https://github.com/sohee9010/Plander",
    ppt: "https://www.miricanvas.com/login?redirect=%2Fv2%2Fdesign2%2F3ec880a3-0a9a-43b0-8eab-7638a52bec86%3Flocation%3Ddesign%26type%3Dcopy_link%26access%3Dlink%26permission%3Dviewer",
    video: "https://o365daejin-my.sharepoint.com/personal/20181403_office_daejin_ac_kr/_layouts/15/onedrive.aspx?id=%2Fpersonal%2F20181403%5Foffice%5Fdaejin%5Fac%5Fkr%2FDocuments%2FMain%2Dpage%2Ezip&parent=%2Fpersonal%2F20181403%5Foffice%5Fdaejin%5Fac%5Fkr%2FDocuments&ga=1",
    imagePosition: "center 15%",
    images: [
      "images/project_4.png",
      "images/project_4-1.png",
      "images/project_4-2.png",
      "images/project_4-3.png",
      "images/project_4-4.png",
      "images/project_4-5.png",
      "images/project_4-6.png"
    ]
  },
  5: {
    category: "mobile",
    title: "담북(Dambook) : Smart Library Manager",
    modalTitleColor: "#E53935",
    subtitle: "데이터 시각화 기반 스마트 서재 관리 앱",
    image: "images/project_5.png",
    period: "2023.09 - 2023.11",
    team: "개인 프로젝트",
    role: "안드로이드 앱 개발",
    status: "완료",
    description: "카카오 도서 검색 API로 책 정보를 불러오고, 독서 상태(읽는 중/완독)를 체계적으로 기록하는 안드로이드 기반 스마트 서재 앱입니다. 단순 기록을 넘어, MPAndroidChart 라이브러리를 활용해 월별 독서량과 상태 비율을 그래프(Data Visualization)로 시각화하여 사용자의 독서 습관을 직관적으로 분석합니다.",
    features: [
      "카카오 도서 검색 API 연동",
      "도서 상태 관리 (읽고 싶은/읽는 중/완독)",
      "MPAndroidChart 활용 독서 통계 시각화",
      "개인 독서 노트 및 평점 기록"
    ],
    techStack: ["Android Studio", "Kakao API", "MPAndroidChart", "Room DB"],
    challenges: "외부 API 연동 시 비동기 처리와 데이터 캐싱이 중요했습니다. Coroutines를 활용하여 매끄러운 사용자 경험을 구현했습니다.",
    results: "데이터 시각화를 통해 독서 동기 부여를 제공하는 완성도 높은 앱을 개발했습니다.",
    github: "https://github.com/sohee9010/BookLogApp",
    report: "https://drive.google.com/drive/folders/1KA9uRc760luR43GfH5RR2--LBt6rtMuO?usp=sharing",
    imagePosition: "center 15%",
    images: [
      "images/project_5-1.png",
      "images/project_5-2.png",
      "images/project_5-3.png",
      "images/project_5-4.png",
      "images/project_5-5.png",
      "images/project_5-6.png",
      "images/project_5-7.png"
    ]
  }
};

/* ===================================
   Career Data & Renderer
   =================================== */
const careerData = {
  timeline: [
    {
      date: "2025.03 - 2026.01",
      title: "클라우드 활용 풀스택 개발 과정",
      company: "한국정보교육원",
      details: ["Java Spring & React 기반 웹 애플리케이션 개발", "클라우드 인프라 구축 및 배포 실습", "팀 프로젝트 리딩 및 애자일 협업 경험", "실무 중심의 풀스택 커리큘럼 이수"]
    },
    {
      date: "2022.03 - 2026.02",
      title: "컴퓨터공학과 학사",
      company: "Daejin University",
      details: ["전공 심화 학습: 자료구조, 알고리즘, 소프트웨어공학", "INOSIF 영상동아리 회장 (2025): 동아리 운영 및 콘텐츠 기획 총괄", "컴퓨터공학 과학생회 임원 (2022): 학과 행사 기획 및 학생 복지 증진 활동", "다양한 팀 프로젝트 참여"]
    }
  ],
  certifications: [
    {
      name: "GTQ 1급 (GTQ Grade 1)",
      date: "2023.05",
      icon: 'svg:<svg viewBox="0 0 64 64" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg"><rect width="64" height="64" rx="12" fill="#001E36"/><path d="M15 17h11.5c5.5 0 9 3 9 7.5s-3.5 7.5-9 7.5H20v13h-5V17zm5 11h6.5c2.5 0 4-1.5 4-3.5s-1.5-3.5-4-3.5H20v7zm22 10.5v2.5c0 1.5 1 2 2.5 2s2.5-.5 2.5-2c0-1.5-1.5-2-3.5-3-3-1.5-6-3.5-6-7s2.5-6 6.5-6c3.5 0 6 2 6.5 5.5h-4.5c-.5-1.5-1-2-2-2s-2 .5-2 1.5c0 1 1.5 1.5 3 2.5 3.5 2 6.5 4 6.5 8s-3 6.5-7 6.5c-4 0-7-2.5-7.5-6h4.5z" fill="#31A8FF"/></svg>',
      desc: "Adobe 툴 활용 및 디자이너와의 원활한 협업"
    },
    {
      name: "Google AI Essentials",
      date: "2024.01",
      icon: 'svg:<svg viewBox="0 0 48 48" style="width:100%; height:100%;" xmlns="http://www.w3.org/2000/svg"><path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/><path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/><path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/></svg>',
      desc: "AI 도구를 활용한 개발 생산성 및 트렌드 학습"
    }
  ]
};

function renderCareer() {
  // Timeline
  const timelineContainer = document.getElementById('timeline-container');
  if (timelineContainer) {
    timelineContainer.innerHTML = careerData.timeline.map(item => `
      <div class="timeline-item fade-in">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <div class="timeline-date"><i class="far fa-calendar-alt"></i> ${item.date}</div>
          <h4>${item.title}</h4>
          <div class="timeline-company">${item.company}</div>
          <ul class="timeline-details">
            ${item.details.map(detail => `<li>${detail}</li>`).join('')}
          </ul>
        </div>
      </div>
    `).join('');
  }

  // Certifications
  const certContainer = document.getElementById('cert-container');
  if (certContainer) {
    certContainer.innerHTML = careerData.certifications.map(cert => {
      const iconHtml = cert.icon.startsWith('svg:')
        ? cert.icon.substring(4)
        : `<i class="${cert.icon}"></i>`;

      return `
      <div class="cert-card fade-in">
        <div class="cert-icon">${iconHtml}</div>
        <div class="cert-info">
          <h4>${cert.name}</h4>
          <p class="cert-desc">${cert.desc}</p>
        </div>
        <div class="cert-date">${cert.date}</div>
      </div>
    `}).join('');
  }
}


// ===================================
// 3D Coverflow Project Renderer
// ===================================

let currentProjectIndex = 0;
let filteredProjectIds = [];
let touchStartX = 0;
let touchEndX = 0;

let lastSwitchTime = 0;

// View State
let currentViewMode = 'slide'; // 'slide' or 'grid'

// Filter projects based on category
function filterProjects(category) {
  if (category === 'all') {
    filteredProjectIds = Object.keys(projectData);
  } else {
    filteredProjectIds = Object.keys(projectData).filter(id => projectData[id].category === category);
  }

  // Reset
  currentProjectIndex = 0;
  lastSwitchTime = Date.now();

  // Render based on current view
  if (currentViewMode === 'slide') {
    render3DCarousel();
  } else {
    renderProjectGrid();
  }
}

// Initial Render and Event Setup
function initProjectSection() {
  // Set initial filter
  filterProjects('all');

  // View Toggle Events (NEW)
  // View Toggle Events (NEW)
  const btnSlide = document.getElementById('view-slide');
  const btnGrid = document.getElementById('view-grid');
  const view3D = document.getElementById('project-viewport-3d');
  const viewGrid = document.getElementById('project-viewport-grid');
  const pagination = document.getElementById('project-pagination');

  // Check Mobile for Default View
  if (window.innerWidth <= 768) {
    currentViewMode = 'grid';
  }

  // Update UI for Initial State
  if (btnSlide && btnGrid && view3D && viewGrid) {
    if (currentViewMode === 'grid') {
      btnGrid.classList.add('active');
      btnSlide.classList.remove('active');
      view3D.classList.add('project-view-hidden');
      viewGrid.classList.remove('project-view-hidden');
      if (pagination) pagination.style.display = 'none';
    } else {
      btnSlide.classList.add('active');
      btnGrid.classList.remove('active');
      view3D.classList.remove('project-view-hidden');
      viewGrid.classList.add('project-view-hidden');
      if (pagination) pagination.style.display = 'flex';
    }
  }

  if (btnSlide && btnGrid) {
    btnSlide.addEventListener('click', () => {
      currentViewMode = 'slide';
      btnSlide.classList.add('active');
      btnGrid.classList.remove('active');
      view3D.classList.remove('project-view-hidden');
      viewGrid.classList.add('project-view-hidden');
      pagination.style.display = 'flex'; // Show dots
      render3DCarousel(); // Refresh
    });

    btnGrid.addEventListener('click', () => {
      currentViewMode = 'grid';
      btnGrid.classList.add('active');
      btnSlide.classList.remove('active');
      view3D.classList.add('project-view-hidden');
      viewGrid.classList.remove('project-view-hidden');
      pagination.style.display = 'none'; // Hide dots
      renderProjectGrid(); // Render Grid
    });
  }

  // Arrow Button Events
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  if (prevBtn) prevBtn.addEventListener('click', prevProject);
  if (nextBtn) nextBtn.addEventListener('click', nextProject);

  // Drag/Touch Events (Only relevant for 3D view, strictly speaking, but keeping attached is fine)
  const track = document.getElementById('project-track');
  if (track) {
    track.addEventListener('mousedown', handleDragStart);
    track.addEventListener('touchstart', handleTouchStart, { passive: false });
    track.addEventListener('touchmove', handleTouchMove, { passive: false });
    track.addEventListener('touchend', handleTouchEnd);
  }
}

// Render Grid View
function renderProjectGrid() {
  const gridContainer = document.getElementById('project-viewport-grid');
  if (!gridContainer) return;

  gridContainer.innerHTML = '';

  if (filteredProjectIds.length === 0) {
    gridContainer.innerHTML = '<div style="grid-column: 1/-1; text-align:center; color:#888;">No projects found.</div>';
    return;
  }

  filteredProjectIds.forEach(id => {
    const p = projectData[id];
    const card = document.createElement('div');
    card.className = 'project-card-grid fade-in';
    card.innerHTML = `
            <div class="grid-image-wrapper">
                ${p.image.endsWith('.mp4')
        ? `<video src="${p.image}" class="lazy-video" loop muted playsinline preload="metadata" style="width: 100%; height: 100%; object-fit: cover; object-position: ${p.imagePosition || 'center center'};"></video>`
        : `<img src="${p.image}" alt="${p.title}" style="object-position: ${p.imagePosition || 'center center'};" loading="lazy">`
      }
            </div>
            <div class="grid-content">
                <span class="grid-category">${p.category}</span>
                <h3 class="grid-title">${p.title}</h3>
                <p class="grid-desc">${p.description}</p>
                <div class="grid-tags">
                    ${p.techStack.slice(0, 3).map(t => `<span class="grid-tag">${t}</span>`).join('')}
                    ${p.techStack.length > 3 ? `<span class="grid-tag">+${p.techStack.length - 3}</span>` : ''}
                </div>
            </div>
        `;

    card.addEventListener('click', () => showProjectModal(id));
    gridContainer.appendChild(card);
  });

  // Trigger animations for new elements
  const newItems = gridContainer.querySelectorAll('.fade-in');
  newItems.forEach(el => observer.observe(el));

  // Init lazy video observer
  initVideoObserver();
}

// ...

function render3DCarousel() {
  const container = document.getElementById('project-track');
  if (!container) return;

  container.innerHTML = '';

  if (filteredProjectIds.length === 0) {
    container.innerHTML = '<div style="color:white; font-size:1.2rem;">No projects found in this category.</div>';
    renderPagination();
    return;
  }

  filteredProjectIds.forEach((id, index) => {
    const p = projectData[id];
    const card = document.createElement('div');
    card.className = `project-card-3d`;
    card.dataset.index = index;
    card.dataset.id = id;

    const gradientClass = `project-gradient-${id}`;

    card.innerHTML = `
      <div class="mac-window-header">
        <div class="window-dot dot-red"></div>
        <div class="window-dot dot-yellow"></div>
        <div class="window-dot dot-green"></div>
        <div class="window-title-bar">portfolio_project_${id}.html</div>
      </div>
      <div class="mac-window-body">
        <div class="project-image-placeholder ${gradientClass}" style="position: absolute; top:0; left:0; width:100%; height:100%; z-index:-1;"></div>
        ${p.image.endsWith('.mp4')
        ? `<video src="${p.image}" class="lazy-video" loop muted playsinline preload="metadata" style="width: 100%; height: 100%; object-fit: cover; object-position: ${p.imagePosition || 'center center'};"></video>`
        : `<img src="${p.image}" alt="${p.title}" style="object-position: ${p.imagePosition || 'center center'};" onerror="this.style.opacity=0">`
      }
      </div>
      <div class="project-info-overlay">
        <h3 class="project-title-3d">${p.title}</h3>
        <p class="project-desc-3d">${p.description}</p>
        <div style="margin-top:10px; font-size:0.8rem; color:#aaa;">Click to view details</div>
      </div>
    `;

    // Hover to switch removed. Only Click or Buttons now.

    card.addEventListener('click', (e) => {
      if (index === currentProjectIndex) {
        showProjectModal(id);
      } else {
        currentProjectIndex = index;
        update3DCarousel();
      }
    });

    container.appendChild(card);
  });

  renderPagination();
  update3DCarousel();
}

function renderPagination() {
  const paginationContainer = document.getElementById('project-pagination');
  if (!paginationContainer) return;

  paginationContainer.innerHTML = '';

  if (filteredProjectIds.length <= 1) return;

  filteredProjectIds.forEach((_, index) => {
    const dot = document.createElement('div');
    dot.className = 'page-dot';
    if (index === currentProjectIndex) dot.classList.add('active');

    dot.addEventListener('click', () => {
      currentProjectIndex = index;
      update3DCarousel();
    });

    paginationContainer.appendChild(dot);
  });
}

function update3DCarousel() {
  const cards = document.querySelectorAll('.project-card-3d');

  // Radius of the carousel "cylinder"
  const radius = 1000;
  // Angle per card (degrees) - Increased to 50 to spread cards fewer overlaps
  const angleStep = 50;

  cards.forEach((card, index) => {
    // Reset specific classes for Z-index or filtering if needed
    card.className = 'project-card-3d';

    // Calculate offset from center with circular wrapping
    let diff = index - currentProjectIndex;
    const totalCards = filteredProjectIds.length;

    // Make it circular: if diff is too large in either direction, wrap it around
    if (diff > totalCards / 2) {
      diff -= totalCards;
    } else if (diff < -totalCards / 2) {
      diff += totalCards;
    }

    // Calculate angle for this card
    const theta = diff * angleStep * (Math.PI / 180); // Convert to radians

    // X position: classic sin wave for arc
    // Increased spread (1.2 multiplier) to reduce overlap and improve clickability
    const x = Math.sin(theta) * radius * 1.2;

    // Z position: curve away from viewer
    let z = (Math.cos(theta) * radius) - radius;

    // Rotation
    const rotateY = -diff * angleStep;

    // Opacity/Visibility
    const absDiff = Math.abs(diff);
    let opacity = 1;
    let blur = 0;

    if (absDiff > 0) {
      opacity = Math.max(0.3, 1 - (absDiff * 0.2)); // Fade out as they go side
      blur = Math.min(10, absDiff * 2); // Blur as they go side
    }

    // Apply Styles
    card.style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${rotateY}deg)`;
    card.style.opacity = opacity;
    card.style.filter = `blur(${blur}px)`;
    card.style.zIndex = 100 - absDiff; // Center is on top

    // Add active class for specific high-lighting/pointer-events
    if (diff === 0) {
      card.classList.add('active');
      card.style.filter = 'none'; // Ensure crisp center
    } else {
      card.style.pointerEvents = 'auto'; // Allow clicking side cards
    }

    // Hide items that are too far back to prevent artifacting or clutter
    if (absDiff >= 2) {
      card.style.opacity = 0;
      card.style.pointerEvents = 'none';
      card.classList.remove('visible'); // Optional helper
    } else {
      // Ensure visible items have proper interaction
      card.style.pointerEvents = 'auto';
    }

    // Video Playback Control for 3D View: Only play the CENTER (active) card
    const video = card.querySelector('video');
    if (video) {
      // Check if this is the active card AND it's actually visible on screen handled by observer state usually,
      // but here we force pause on non-active cards.
      if (diff === 0) {
        // It's the center card. Play if logic allows (e.g. if observer says it's visible).
        // We can check dataset.intersecting if set by observer, or just try playing.
        // Safe bet: if it has 'lazy-video', rely on Observer to start it, 
        // BUT we must ensure if we just switched to it, we try to play.
        if (video.dataset.intersecting === 'true') {
          video.play().catch(e => { /* Ignore autoplay errors */ });
        }
      } else {
        // Not center? PAUSE immediately.
        video.pause();
      }
    }
  });

  // Update Pagination Dots
  const dots = document.querySelectorAll('.page-dot');
  dots.forEach((dot, index) => {
    if (index === currentProjectIndex) dot.classList.add('active');
    else dot.classList.remove('active');
  });
}

// Interaction Handlers
let isThrottled = false;
function handleWheel(e) {
  // Check if scrolling primarily horizontal or intent is horizontal switch
  if (Math.abs(e.deltaY) > 10 || Math.abs(e.deltaX) > 10) {
    // If we are over the track, we want to control the carousel
    e.preventDefault();

    if (isThrottled) return;

    if (e.deltaY > 0 || e.deltaX > 0) {
      nextProject();
    } else {
      prevProject();
    }

    isThrottled = true;
    setTimeout(() => { isThrottled = false; }, 400); // 400ms throttle
  }
}

function nextProject() {
  currentProjectIndex = (currentProjectIndex + 1) % filteredProjectIds.length;
  update3DCarousel();
}

function prevProject() {
  currentProjectIndex = (currentProjectIndex - 1 + filteredProjectIds.length) % filteredProjectIds.length;
  update3DCarousel();
}

// Drag Support
let isDragging = false;
let startX = 0;

function handleDragStart(e) {
  isDragging = true;
  startX = e.pageX;
  document.body.style.cursor = 'grabbing';
}

document.addEventListener('mouseup', () => {
  if (isDragging) {
    isDragging = false;
    document.body.style.cursor = '';
  }
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const currentX = e.pageX;
  const diff = startX - currentX;

  // Reduced threshold for "snappy" feeling
  if (Math.abs(diff) > 50) {
    if (diff > 0) nextProject();
    else prevProject();
    isDragging = false;
    document.body.style.cursor = '';
  }
});

// Touch Support
function handleTouchStart(e) {
  touchStartX = e.changedTouches[0].screenX;
}

function handleTouchMove(e) {
  // Prevent scrolling page while trying to swipe gallery
  if (e.target.closest('#project-track')) {
    e.preventDefault();
  }
}

function handleTouchEnd(e) {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
}

function handleSwipe() {
  const diff = touchStartX - touchEndX;
  if (Math.abs(diff) > 40) { // Sensitive swipe
    if (diff > 0) nextProject();
    else prevProject();
  }
}


// Initialize Sections
document.addEventListener('DOMContentLoaded', () => {
  initProjectSection();
  renderCareer();
  setTimeout(startTypingLoop, 500);
  initContactForm();

  // ... rest of init
  const newFadeElements = document.querySelectorAll('.timeline-item.fade-in, .cert-card.fade-in');
  // Check if observer is defined (usually global)
  if (typeof observer !== 'undefined') {
    newFadeElements.forEach((el, index) => {
      observer.observe(el);
    });
  }
});


// ===================================
// Project Modal System
// ===================================
function showProjectModal(projectId) {
  const project = projectData[projectId];
  if (!project) return;

  const modal = document.getElementById('projectModal');
  const modalContent = document.getElementById('modalContent');

  // Calculate gallery pages
  const isMultiView = projectId === '5' || projectId === '4';
  const itemsPerView = isMultiView ? 2 : 1;
  const totalPages = project.images ? Math.ceil(project.images.length / itemsPerView) : 0;

  // 모달 콘텐츠 생성 (Split View)
  modalContent.innerHTML = `
    <!-- macOS Window Header -->
    <div class="mac-modal-header">
      <div class="mac-traffic-lights">
        <div class="mac-dot mac-red" onclick="closeModal()"></div>
        <div class="mac-dot mac-yellow"></div>
        <div class="mac-dot mac-green"></div>
      </div>
      <div class="mac-window-title">portfolio_detail_${projectId}.pdf</div>
    </div>

    <!-- Explicit Close Button (Top Right) -->
    <button class="modal-close" onclick="closeModal()">
        <i class="fas fa-times"></i>
    </button>
    
    <div class="modal-content-inner" style="padding: 40px 50px;">
      <div class="modal-header">
        <h2 class="modal-title" style="color: #1D1D1F;">${project.title}</h2>
        <p class="modal-subtitle">${project.subtitle}</p>
        <div class="modal-meta">
          <span class="modal-meta-item">📅 ${project.period}</span>
          <span class="modal-meta-item">👥 ${project.team}</span>
          <span class="modal-meta-item">👤 ${project.role}</span>
          <span class="modal-meta-item">✅ ${project.status}</span>
        </div>
      </div>

      ${project.images && project.images.length > 0 ? `
        <div class="modal-gallery-wrapper" style="position: relative; margin-bottom: 30px;">
          <!-- Navigation Button: Previous -->
          <button onclick="scrollGallery(-1)" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); z-index: 10; background: rgba(255, 255, 255, 0.8); border: 1px solid rgba(0,0,0,0.1); border-radius: 50%; width: 40px; height: 40px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #333; backdrop-filter: blur(4px);">❮</button>
          
          <div class="modal-gallery-container" id="modalGallery" style="display: flex; gap: 16px; overflow-x: auto; padding: 10px 0; scroll-snap-type: x mandatory; scroll-behavior: smooth; scrollbar-width: none; -ms-overflow-style: none;">
            ${project.images.map(imgSrc => {
    // For Damok (ID 5) and Plander (ID 4), show 2 images. For others, show 1 image.
    const isMultiView = projectId === '5' || projectId === '4';
    const widthStyle = isMultiView ? 'calc(50% - 8px)' : '100%';
    const isVideo = imgSrc.toLowerCase().endsWith('.mp4');

    const commonStyle = `flex: 0 0 ${widthStyle}; width: ${widthStyle}; height: auto; max-height: 500px; object-fit: contain; object-position: top; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); scroll-snap-align: start; background: #f5f5f7;`;

    if (isVideo) {
      return `<video src="${imgSrc}" autoplay loop muted playsinline style="${commonStyle}"></video>`;
    } else {
      return `<img src="${imgSrc}" alt="${project.title} screenshot" style="${commonStyle}">`;
    }
  }).join('')}
          </div>
  
          <!-- Navigation Button: Next -->
          <button onclick="scrollGallery(1)" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); z-index: 10; background: rgba(255, 255, 255, 0.8); border: 1px solid rgba(0,0,0,0.1); border-radius: 50%; width: 40px; height: 40px; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); display: flex; align-items: center; justify-content: center; font-size: 1.2rem; color: #333; backdrop-filter: blur(4px);">❯</button>
        </div>
        <div id="galleryCounter" style="text-align: center; margin-top: -15px; margin-bottom: 25px; font-size: 0.95rem; color: #666; letter-spacing: 1px;">
          1 / ${totalPages}
        </div>
      ` : project.image ? `
        <div class="modal-project-image">
          <img src="${project.image}" alt="${project.title}" style="object-position: ${project.imagePosition || 'top'};">
        </div>
      ` : ''}
      
      <div class="modal-section">
        <h3>프로젝트 개요</h3>
        <p>${project.description}</p>
      </div>

      <div class="modal-section">
        <h3>주요 기능</h3>
        <ul>
          ${project.features.map(feature => `<li>${feature}</li>`).join('')}
        </ul>
      </div>

      <div class="modal-section">
        <h3>기술 스택</h3>
        <div class="modal-tech-stack">
          ${project.techStack.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
        </div>
      </div>

      <div class="modal-section">
        <h3>도전 과제</h3>
        <p>${project.challenges}</p>
      </div>

      <div class="modal-section">
        <h3>성과</h3>
        <p>${project.results}</p>
      </div>

      <div class="modal-links">
        <a href="${project.github}" target="_blank" class="modal-link-btn modal-link-primary">
          <i class="fab fa-github"></i> ${project.githubLabel || 'GitHub 보기 →'}
        </a>
        ${project.demo ? `
          <a href="${project.demo}" target="_blank" class="modal-link-btn modal-link-secondary">
            라이브 데모 →
          </a>
        ` : ''}
        ${project.ppt ? `
          <a href="${project.ppt}" target="_blank" class="modal-link-btn modal-link-secondary">
            <i class="fas fa-file-powerpoint"></i> PPT 보기 →
          </a>
        ` : ''}
        ${project.video ? `
          <a href="${project.video}" target="_blank" class="modal-link-btn modal-link-secondary">
            <i class="fas fa-play-circle"></i> 시연 영상 보기 →
          </a>
        ` : ''}
        ${project.report ? `
          <a href="${project.report}" target="_blank" class="modal-link-btn modal-link-secondary">
            <i class="fas fa-file-alt"></i> 보고서 보기 →
          </a>
        ` : ''}
      </div>
    </div>
  `;

  // Gallery Scroll Listener
  const gallery = document.getElementById('modalGallery');
  const counter = document.getElementById('galleryCounter');
  if (gallery && counter) {
    // Hide scrollbar but keep functionality
    gallery.style.scrollbarWidth = 'none'; // Firefox

    gallery.addEventListener('scroll', () => {
      const page = Math.round(gallery.scrollLeft / gallery.clientWidth) + 1;
      counter.textContent = `${page} / ${totalPages}`;
    });
  }

  // 모달 표시
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// 모달 닫기 함수
function closeModal() {
  const modal = document.getElementById('projectModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// 닫기 버튼 이벤트 (Old button removal check)
// const modalCloseBtn = document.querySelector('.modal-close'); // Remvoed form HTML

// 모달 외부 클릭 시 닫기
const projectModal = document.getElementById('projectModal');
if (projectModal) {
  projectModal.addEventListener('click', function (e) {
    if (e.target === this) {
      closeModal();
    }
  });
}

// ESC 키로 모달 닫기
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// ===================================
// Email Copy to Clipboard & Toast Notification
// ===================================
function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 2000);
}

function copyEmail() {
  const email = '1545thgml@naver.com';
  navigator.clipboard.writeText(email).then(() => {
    // Show "Copied!" text feedback
    const textElement = document.querySelector('.email-link .connect-text');
    if (textElement) {
      const originalText = textElement.textContent;
      textElement.textContent = 'Copied!';
      setTimeout(() => {
        textElement.textContent = originalText;
      }, 2000);
    }
    showToast('Email copied to clipboard!');
  }).catch(err => {
    alert('Email copied: ' + email);
  });
}

function copyContactEmail(event) {
  event.preventDefault();
  const email = '1545thgml@naver.com';

  // Copy to clipboard
  navigator.clipboard.writeText(email).then(() => {
    // Get the badge element
    const badge = event.currentTarget;
    const emailTextElement = badge.querySelector('.email-text');

    if (emailTextElement) {
      const originalText = emailTextElement.textContent;

      // Show "Copied!" feedback
      emailTextElement.textContent = '✓ Copied!';
      badge.style.background = 'rgba(127, 82, 255, 0.15)';
      badge.style.borderColor = 'rgba(127, 82, 255, 0.4)';

      // Reset after 2 seconds
      setTimeout(() => {
        emailTextElement.textContent = originalText;
        badge.style.background = '';
        badge.style.borderColor = '';
      }, 2000);
    }
  }).catch(err => {
    console.error('Failed to copy email:', err);
  });
}

// Gallery Navigation Handler
window.scrollGallery = function (direction) {
  const container = document.getElementById('modalGallery');
  if (container) {
    const scrollAmount = container.clientWidth;
    container.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
  }
};

// Video Intersection Observer
let videoObserver;

function initVideoObserver() {
  if (videoObserver) {
    videoObserver.disconnect();
  }

  const options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1 // Optimization: Reduced threshold to 0.1 for better responsiveness
  };

  videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target;
      const isIntersecting = entry.isIntersecting;

      // Store state for other functions to use
      video.dataset.intersecting = isIntersecting;

      if (isIntersecting) {
        // LOGIC REFINEMENT:
        // If in Slide Mode (3D), only play if it's the current index.
        // If in Grid Mode, play if visible.

        let shouldPlay = true;

        if (currentViewMode === 'slide') {
          const card = video.closest('.project-card-3d');
          if (card) {
            const index = parseInt(card.dataset.index);
            if (index !== currentProjectIndex) {
              shouldPlay = false;
            }
          }
        }

        if (shouldPlay) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.log('Autoplay prevented:', error);
              video.muted = true;
              video.play().catch(e => console.log('Retry play failed', e));
            });
          }
        } else {
          video.pause();
        }
      } else {
        video.pause();
        video.currentTime = 0; // Reset
      }
    });
  }, options);

  const videos = document.querySelectorAll('.lazy-video');
  videos.forEach(v => videoObserver.observe(v));
}

// Ensure init is called on load for the default view
document.addEventListener('DOMContentLoaded', () => {
  // Other init functions are called in initProjectSection
  // But we need to make sure observer picks up initial videos
  setTimeout(initVideoObserver, 1000);
});

/* Opening Screen Interactive Logic */

/* Opening Screen Interactive Logic REMOVED - User wants ENTER KEY ONLY */
document.addEventListener('DOMContentLoaded', () => {
  const openingScreen = document.getElementById('opening-screen');
  // Logic handled by opening-3d.js (Enter Key)
  if (openingScreen) {
    // Prevent default scroll behaviors on opening screen
    openingScreen.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
    openingScreen.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  }
});

