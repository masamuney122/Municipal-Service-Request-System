import React, { useState } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';

interface ChatMessageProps {
  sender: string;
  message: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ sender, message }) => (
  <Box sx={{ display: 'flex', justifyContent: sender === 'AI' ? 'flex-start' : 'flex-end', mb: 2 }}>
    <Box sx={{ maxWidth: '70%', bgcolor: sender === 'AI' ? 'primary.light' : 'secondary.light', p: 2, borderRadius: 1 }}>
      <Typography variant="body1">{message}</Typography>
    </Box>
  </Box>
);

interface ChatInputProps {
  onSend: (message: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSend }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Type your message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
      />
      <Button variant="contained" color="primary" onClick={handleSend}>
        Send
      </Button>
    </Box>
  );
};

interface ChatContainerProps {
  children: React.ReactNode;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ children }) => (
  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
    {children}
  </Box>
);