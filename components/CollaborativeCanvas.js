import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const EMOJIS = ["😊", "😎", "🤓", "🦁", "🐯", "🐶", "🐱", "🦊", "🦄", "🐸"];

const CollaborativeCanvas = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('');
  const [reactions, setReactions] = useState([]);
  const canvasRef = useRef(null);
  const wsRef = useRef(null);

  useEffect(() => {
    if (isLoggedIn) {
      // Initialize WebSocket connection
      wsRef.current = new WebSocket('ws://localhost:3000/api/ws');
      
      wsRef.current.onopen = () => {
        console.log('Connected to WebSocket');
      };

      wsRef.current.onmessage = (event) => {
        const newReaction = JSON.parse(event.data);
        setReactions(prev => [...prev, newReaction]);
      };

      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
      };
    }
  }, [isLoggedIn]);

  const handleCanvasClick = (e) => {
    if (!isLoggedIn) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newReaction = {
      x,
      y,
      emoji: selectedEmoji,
      userName,
      timestamp: Date.now()
    };

    // Send reaction through WebSocket
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify(newReaction));
    }
  };

  const handleLogin = () => {
    if (userName && selectedEmoji) {
      setIsLoggedIn(true);
    }
  };

  if (!isLoggedIn) {
    return (
      <Card className="w-96 mx-auto mt-10">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-center">Join Canvas</h2>
            <Input
              type="text"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full"
            />
            <div className="grid grid-cols-5 gap-2">
              {EMOJIS.map((emoji) => (
                <Button
                  key={emoji}
                  variant={selectedEmoji === emoji ? "default" : "outline"}
                  className="text-2xl p-2"
                  onClick={() => setSelectedEmoji(emoji)}
                >
                  {emoji}
                </Button>
              ))}
            </div>
            <Button 
              className="w-full"
              onClick={handleLogin}
              disabled={!userName || !selectedEmoji}
            >
              Join Canvas
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{selectedEmoji}</span>
          <span className="font-medium">{userName}</span>
        </div>
        <Button 
          variant="outline"
          onClick={() => setIsLoggedIn(false)}
        >
          Leave Canvas
        </Button>
      </div>
      <div
        ref={canvasRef}
        className="w-full h-96 bg-gray-100 rounded-lg relative cursor-pointer"
        onClick={handleCanvasClick}
      >
        {reactions.map((reaction, index) => (
          <div
            key={index}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
            style={{
              left: reaction.x,
              top: reaction.y,
            }}
          >
            <div className="text-2xl animate-bounce">{reaction.emoji}</div>
            <div className="text-xs text-center">{reaction.userName}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollaborativeCanvas;