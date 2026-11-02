export function Avatar({ profile, size = 36 }) {
  const style = { width: size, height: size, fontSize: size * 0.4 };
  if (profile.avatar) return <img className="avatar" style={style} src={profile.avatar} alt="" />;
  return <span className="avatar" style={style}>{profile.display_name.trim()[0]?.toUpperCase()}</span>;
}
