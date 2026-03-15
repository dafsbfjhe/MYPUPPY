import React, { useState, useEffect } from 'react';
import './SplashScreen.css';

const messages = [
  "오늘도 우리 강아지와 행복한 하루가 시작됩니다 🐶",
  "귀여운 발걸음과 함께하는 특별한 시간",
  "우리 강아지와의 산책은 하루 중 가장 행복한 순간입니다",
  "강아지와 함께하는 시간은 언제나 옳습니다",
  "오늘도 꼬리 흔드는 행복을 만나보세요",
  "작은 발걸음이 큰 행복을 만듭니다",
  "우리 강아지가 있어서 오늘도 웃습니다",
  "사랑스러운 눈빛이 하루를 따뜻하게 만듭니다",
  "오늘 산책은 어떤 추억이 될까요?",
  "강아지와 함께라면 평범한 하루도 특별합니다",
  "꼬리 흔드는 순간이 하루의 힐링입니다",
  "우리 강아지와 걷는 길은 언제나 즐겁습니다",
  "사랑은 네 발로 걸어옵니다",
  "우리 강아지의 하루는 오늘도 행복합니다",
  "강아지와 함께하는 순간이 가장 소중합니다",
  "오늘도 우리 강아지와 추억을 만들어보세요",
  "행복은 강아지 발자국을 따라옵니다",
  "강아지와 함께하는 하루는 언제나 선물입니다",
  "귀여운 친구와 함께하는 따뜻한 시간",
  "우리 강아지가 있어서 세상이 더 행복합니다"
];

const SplashScreen: React.FC = () => {
  const [randomMessage, setRandomMessage] = useState('');

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * messages.length);
    setRandomMessage(messages[randomIndex]);
  }, []);

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="splash-logo">
          {/* 이미지 경로는 나중에 교체 가능하도록 이미지 태그로 구성 */}
          <img 
            src="https://img.icons8.com/color/192/000000/dog.png" 
            alt="Puppy Character" 
            className="splash-image"
          />
        </div>
        <p className="splash-message">{randomMessage}</p>
      </div>
    </div>
  );
};

export default SplashScreen;
