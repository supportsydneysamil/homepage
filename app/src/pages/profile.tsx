import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useRequireAuth } from '../lib/swaAuth';

const AVATAR_STORAGE_KEY = 'swa:avatar';
const PROFILE_STORAGE_KEY = 'swa:profile';
const GRAPH_PROFILE_ENDPOINT = '/api/profile';
const GRAPH_PHOTO_ENDPOINT = '/api/profile/photo';

type ProfileData = {
  displayName: string;
  title: string;
  ministryTeam: string;
  campus: string;
  phone: string;
  bio: string;
};

const emptyProfile: ProfileData = {
  displayName: '',
  title: '',
  ministryTeam: '',
  campus: '',
  phone: '',
  bio: '',
};

const ProfilePage = () => {
  const { user, isAuthenticated, isLoading } = useRequireAuth();
  const [avatar, setAvatar] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData>(emptyProfile);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const hasLocalProfile = useMemo(
    () =>
      Boolean(profile.displayName || profile.title || profile.ministryTeam || profile.campus || profile.phone || profile.bio),
    [profile]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setAvatar(window.localStorage.getItem(AVATAR_STORAGE_KEY));
    const saved = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (saved) {
      try {
        setProfile({ ...emptyProfile, ...JSON.parse(saved) });
      } catch (parseError) {
        setProfile(emptyProfile);
      }
    }
  }, []);

  if (isLoading) {
    return <p>Checking access...</p>;
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Please keep the image under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null;
      if (result && typeof window !== 'undefined') {
        window.localStorage.setItem(AVATAR_STORAGE_KEY, result);
        window.dispatchEvent(new Event('swa-avatar-updated'));
        setAvatar(result);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarClear = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(AVATAR_STORAGE_KEY);
    window.dispatchEvent(new Event('swa-avatar-updated'));
    setAvatar(null);
  };

  const handleProfileChange = (field: keyof ProfileData) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleProfileSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    setStatus('Profile saved locally.');
  };

  const handleProfileReset = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    setProfile(emptyProfile);
    setStatus('Local profile cleared.');
  };

  const syncFromEntra = async () => {
    setError(null);
    setStatus(null);
    try {
      const profileRes = await fetch(GRAPH_PROFILE_ENDPOINT, { credentials: 'include' });
      if (profileRes.ok) {
        const data = (await profileRes.json()) as {
          displayName?: string;
          jobTitle?: string;
          department?: string;
          officeLocation?: string;
          mobilePhone?: string;
        };
        setProfile((prev) => ({
          ...prev,
          displayName: data.displayName || prev.displayName,
          title: data.jobTitle || prev.title,
          ministryTeam: data.department || prev.ministryTeam,
          campus: data.officeLocation || prev.campus,
          phone: data.mobilePhone || prev.phone,
        }));
      }

      const photoRes = await fetch(GRAPH_PHOTO_ENDPOINT, { credentials: 'include' });
      if (photoRes.ok) {
        const blob = await photoRes.blob();
        if (blob.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = () => {
            const result = typeof reader.result === 'string' ? reader.result : null;
            if (result && typeof window !== 'undefined') {
              window.localStorage.setItem(AVATAR_STORAGE_KEY, result);
              window.dispatchEvent(new Event('swa-avatar-updated'));
              setAvatar(result);
            }
          };
          reader.readAsDataURL(blob);
        }
      }

      setStatus('Synced from Entra ID (if endpoints are configured).');
    } catch (syncError) {
      setError('Unable to sync yet. Connect Microsoft Graph via Functions to enable this.');
    }
  };

  return (
    <section className="profile-page">
      <div className="section__header">
        <span className="eyebrow">Profile</span>
        <h1>Your account</h1>
        <p className="lead">Manage your profile details and login identity.</p>
      </div>

      <div className="profile-grid">
        <article className="card profile-card">
          <h2>Avatar</h2>
          <div className="avatar-editor">
            {avatar ? (
              <img className="profile-avatar" src={avatar} alt="Profile avatar" />
            ) : (
              <div className="profile-avatar profile-avatar--placeholder">No photo</div>
            )}
            <div className="avatar-actions">
              <label className="button ghost">
                Upload image
                <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
              </label>
              <button type="button" className="button text" onClick={handleAvatarClear}>
                Remove
              </button>
            </div>
            <p className="muted">
              Tip: If you want to pull the Azure Entra ID photo automatically, we can wire this to
              Microsoft Graph once Functions are added.
            </p>
            {error ? <p className="error-text">{error}</p> : null}
          </div>
        </article>

        <article className="card profile-card">
          <h2>Identity</h2>
          <div className="profile-info">
            <div>
              <span className="muted">Email</span>
              <p>{user?.userDetails || '-'}</p>
            </div>
            <div>
              <span className="muted">Provider</span>
              <p>{user?.identityProvider || '-'}</p>
            </div>
            <div>
              <span className="muted">Roles</span>
              <p>{user?.userRoles?.join(', ') || '-'}</p>
            </div>
          </div>
        </article>
      </div>

      <div className="section section--split">
        <article className="glass-card">
          <span className="eyebrow">Profile details</span>
          <h2>About you</h2>
          <form className="form profile-form" onSubmit={handleProfileSave}>
            <label className="form__field">
              Display name
              <input type="text" value={profile.displayName} onChange={handleProfileChange('displayName')} />
            </label>
            <label className="form__field">
              Title / role
              <input type="text" value={profile.title} onChange={handleProfileChange('title')} />
            </label>
            <label className="form__field">
              Ministry team
              <input type="text" value={profile.ministryTeam} onChange={handleProfileChange('ministryTeam')} />
            </label>
            <label className="form__field">
              Campus / location
              <input type="text" value={profile.campus} onChange={handleProfileChange('campus')} />
            </label>
            <label className="form__field">
              Phone
              <input type="tel" value={profile.phone} onChange={handleProfileChange('phone')} />
            </label>
            <label className="form__field">
              Bio
              <textarea rows={4} value={profile.bio} onChange={handleProfileChange('bio')} />
            </label>
            <div className="hero__actions">
              <button type="submit" className="button">
                Save locally
              </button>
              <button type="button" className="button ghost" onClick={syncFromEntra}>
                Sync from Entra ID
              </button>
              <button
                type="button"
                className="button text"
                onClick={handleProfileReset}
                disabled={!hasLocalProfile}
              >
                Clear
              </button>
            </div>
            {status ? <p className="success-text">{status}</p> : null}
          </form>
        </article>
        <article className="glass-card">
          <span className="eyebrow">Next step</span>
          <h2>Connect Microsoft Graph</h2>
          <p className="muted">
            To auto-load your Entra ID photo and profile fields, add Azure Functions that proxy
            Microsoft Graph with user consent. This page is ready to consume:
          </p>
          <ul className="highlight-list">
            <li>
              <span className="dot" /> GET {GRAPH_PROFILE_ENDPOINT} → displayName, jobTitle, department, officeLocation, mobilePhone
            </li>
            <li>
              <span className="dot" /> GET {GRAPH_PHOTO_ENDPOINT} → photo bytes
            </li>
          </ul>
        </article>
      </div>
    </section>
  );
};

export default ProfilePage;
