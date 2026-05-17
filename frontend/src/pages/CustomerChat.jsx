import ChatWidget from '../components/ChatWidget.jsx';

export default function CustomerChat({ customer }) {
  return (
    <div className="flex flex-1" style={{ height: 'calc(100vh - 57px)', minHeight: 0 }}>
      <ChatWidget customer={customer} />
    </div>
  );
}
