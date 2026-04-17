"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { SessionUser } from "@/lib/auth";

interface ChatContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  specialty?: string | null;
  isAvailable?: boolean | null;
}

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  senderId: string;
  recipientId: string;
  sender: { id: string; firstName: string; lastName: string; role: string };
  recipient: { id: string; firstName: string; lastName: string; role: string };
}

function roleBadgeVariant(role: string): "info" | "success" {
  return role === "DOCTOR" ? "info" : "success";
}

export function DirectChat({ user }: { user: SessionUser }) {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");

  const selectedContact = useMemo(
    () => contacts.find((c) => c.id === selectedContactId) || null,
    [contacts, selectedContactId]
  );

  const visibleContacts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((contact) => {
      const name = `${contact.firstName} ${contact.lastName}`.toLowerCase();
      return (
        name.includes(q) ||
        contact.email.toLowerCase().includes(q) ||
        (contact.specialty || "").toLowerCase().includes(q)
      );
    });
  }, [contacts, search]);

  const loadContacts = async () => {
    setContactsLoading(true);
    try {
      const res = await fetch("/api/chat/staff");
      if (res.ok) {
        const json = await res.json();
        setContacts(json.data);
        if (!selectedContactId && json.data.length > 0) {
          setSelectedContactId(json.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch chat contacts:", err);
    } finally {
      setContactsLoading(false);
    }
  };

  const loadMessages = async (contactId: string) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/chat/messages?withUserId=${contactId}`);
      if (res.ok) {
        const json = await res.json();
        setMessages(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedContactId) {
      setMessages([]);
      return;
    }

    loadMessages(selectedContactId);
    const timer = setInterval(() => loadMessages(selectedContactId), 5000);
    return () => clearInterval(timer);
  }, [selectedContactId]);

  const sendMessage = async () => {
    if (!selectedContactId) return;

    const content = draft.trim();
    if (!content) return;

    setSending(true);
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientId: selectedContactId, content }),
      });

      if (res.ok) {
        setDraft("");
        await loadMessages(selectedContactId);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const onComposerKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = async (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      await sendMessage();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-150px)] min-h-[620px]">
      <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-800 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-slate-100">Care Team Chat</h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Doctors & nurses direct messages</p>
          </div>
          <Input
            placeholder="Search staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="overflow-y-auto h-[calc(100%-108px)] p-2">
          {contactsLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : visibleContacts.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-400 p-4">No staff found</p>
          ) : (
            <div className="space-y-1">
              {visibleContacts.map((contact) => {
                const isActive = selectedContactId === contact.id;
                return (
                  <button
                    key={contact.id}
                    onClick={() => setSelectedContactId(contact.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors border ${
                      isActive
                        ? "bg-brand-50 dark:bg-brand-900/20 border-brand-200 dark:border-brand-900/40"
                        : "bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar firstName={contact.firstName} lastName={contact.lastName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-slate-100 truncate">
                            {contact.firstName} {contact.lastName}
                          </p>
                          <Badge variant={roleBadgeVariant(contact.role)} className="text-[10px] px-1.5 py-0">
                            {contact.role === "DOCTOR" ? "Doctor" : "Nurse"}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-slate-400 truncate">{contact.email}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 min-h-[69px]">
          {selectedContact ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Avatar firstName={selectedContact.firstName} lastName={selectedContact.lastName} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
                    {selectedContact.firstName} {selectedContact.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {selectedContact.role === "DOCTOR" ? "Doctor" : "Nurse"}
                    {selectedContact.specialty ? ` · ${selectedContact.specialty}` : ""}
                  </p>
                </div>
              </div>
              <Badge variant={selectedContact.isAvailable ? "success" : "muted"} dot>
                {selectedContact.isAvailable ? "Available" : "Unavailable"}
              </Badge>
            </div>
          ) : (
            <p className="text-sm text-gray-400 dark:text-slate-400">Select a colleague to start chatting</p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-gray-50/50 dark:bg-slate-950/40">
          {!selectedContact ? null : messagesLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-400">No messages yet. Start the conversation.</p>
          ) : (
            messages.map((msg) => {
              const mine = msg.senderId === user.id;
              return (
                <div key={msg.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2.5 border ${
                      mine
                        ? "bg-brand-600 text-white border-brand-600"
                        : "bg-white dark:bg-slate-900 text-gray-800 dark:text-slate-100 border-gray-200 dark:border-slate-700"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={`text-[10px] mt-1 ${mine ? "text-white/75" : "text-gray-400 dark:text-slate-500"}`}>
                      {new Date(msg.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onComposerKeyDown}
              placeholder={selectedContact ? "Type a message..." : "Select a colleague first"}
              disabled={!selectedContact || sending}
              rows={2}
              className="flex-1 px-3 py-2.5 text-sm bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl placeholder:text-gray-400 dark:placeholder:text-slate-500 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-400/30 focus:border-brand-400 transition-all duration-150 resize-none"
            />
            <Button
              onClick={sendMessage}
              disabled={!selectedContact || !draft.trim()}
              loading={sending}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
