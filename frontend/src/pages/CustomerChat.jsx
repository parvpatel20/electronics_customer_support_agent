import ChatWidget from '../components/ChatWidget.jsx';

export default function CustomerChat({ customer }) {
  return (
    <div
      className="flex flex-1"
      style={{ height: 'calc(100vh - var(--nav-height))', minHeight: 0, background: 'var(--bg)' }}
    >
      <ChatWidget customer={customer} />
    </div>
  );
}
