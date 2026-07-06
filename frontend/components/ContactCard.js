export default function ContactCard({ contact }) {
  return (
    <div className="border border-border rounded-lg p-3">
      <div className="text-sm text-white font-medium">{contact.name}</div>
      <div className="text-xs text-gray-400 mb-1">{contact.title}</div>
      {contact.email && (
        <div className="text-xs text-accent">
          {contact.email} {contact.emailConfidence ? <span className="text-gray-500">({contact.emailConfidence}% confidence)</span> : null}
        </div>
      )}
      {contact.linkedinUrl && (
        <a href={contact.linkedinUrl} target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-accent">
          LinkedIn ↗
        </a>
      )}
    </div>
  );
}
