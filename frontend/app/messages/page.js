'use client';

import { useEffect, useRef, useState } from 'react';
import RequireAuth from '../../components/RequireAuth';
import { useAuth } from '../../lib/AuthContext';
import { apiFetch, ApiError } from '../../lib/api';
import { getSocket } from '../../lib/socket';

export default function MessagesPage() {
  return (
    <RequireAuth>
      <MessagesContent />
    </RequireAuth>
  );
}

function MessagesContent() {
  const { profile } = useAuth();
  const [conversations, setConversations] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/messages/conversations')
      .then((data) => {
        setConversations(data.conversations);
        if (data.conversations[0]) setActiveId(data.conversations[0]._id);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Could not load conversations.'));
  }, []);

  const active = conversations?.find((c) => c._id === activeId);
  const otherParticipant = active?.participants.find((p) => p._id !== profile?._id);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <h1 className="font-display text-3xl mb-6">Messages</h1>
      {error && <p className="text-learn-dark mb-4">{error}</p>}

      <div className="grid md:grid-cols-[280px_1fr] border border-line rounded-2xl overflow-hidden bg-white/60 min-h-[500px]">
        <div className="border-r border-line">
          {conversations === null && <p className="p-4 text-sm text-ink/40">Loading…</p>}
          {conversations?.length === 0 && (
            <p className="p-4 text-sm text-ink/50">
              No conversations yet. Accept a swap request to start chatting.
            </p>
          )}
          {conversations?.map((c) => {
            const other = c.participants.find((p) => p._id !== profile?._id);
            return (
              <button
                key={c._id}
                onClick={() => setActiveId(c._id)}
                className={`w-full text-left px-4 py-3 border-b border-line/60 hover:bg-teach-tint/30 transition-colors ${
                  c._id === activeId ? 'bg-teach-tint/40' : ''
                }`}
              >
                <p className="font-medium text-sm">{other?.displayName}</p>
                <p className="text-xs text-ink/50 truncate">{c.lastMessagePreview || 'Say hello!'}</p>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col">
          {active ? (
            <ChatPane conversation={active} otherParticipant={otherParticipant} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-ink/40 text-sm">
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChatPane({ conversation, otherParticipant }) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    apiFetch(`/api/messages/conversations/${conversation._id}/messages`)
      .then((data) => !cancelled && setMessages(data.messages))
      .catch(() => !cancelled && setError('Could not load message history.'));

    getSocket()
      .then((socket) => {
        if (cancelled) return;
        socketRef.current = socket;

        socket.emit('join_conversation', conversation._id, (ack) => {
          if (!ack?.ok) setError(ack?.error || 'Could not join conversation.');
          else setConnected(true);
        });

        const onNewMessage = (message) => {
          if (message.conversation === conversation._id) {
            setMessages((prev) => [...prev, message]);
          }
        };
        socket.on('new_message', onNewMessage);

        socket.__cleanup = () => socket.off('new_message', onNewMessage);
      })
      .catch(() => setError('Could not connect to chat.'));

    return () => {
      cancelled = true;
      socketRef.current?.__cleanup?.();
    };
  }, [conversation._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function send(e) {
    e.preventDefault();
    if (!text.trim() || !socketRef.current) return;
    socketRef.current.emit('send_message', { conversationId: conversation._id, text }, (ack) => {
      if (!ack?.ok) setError(ack?.error || 'Message failed to send.');
    });
    setText('');
  }

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-line px-4 py-3">
        <p className="font-medium">{otherParticipant?.displayName}</p>
        {!connected && <p className="text-xs text-ink/40">Connecting…</p>}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2 max-h-[400px]">
        {messages.map((m) => {
          const isMine = m.sender === profile?._id || m.sender?._id === profile?._id;
          return (
            <div key={m._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] px-3.5 py-2 rounded-2xl text-sm ${
                  isMine ? 'bg-teach text-paper' : 'bg-paper border border-line'
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && <p className="px-4 text-xs text-learn-dark">{error}</p>}

      <form onSubmit={send} className="border-t border-line p-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="flex-1 border border-line rounded-full px-4 py-2 bg-white focus:border-teach outline-none text-sm"
        />
        <button
          type="submit"
          className="bg-teach text-paper px-5 py-2 rounded-full text-sm hover:bg-teach-dark transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
