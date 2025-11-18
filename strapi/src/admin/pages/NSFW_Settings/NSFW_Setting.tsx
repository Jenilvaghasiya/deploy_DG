import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FaSave, FaShieldAlt } from 'react-icons/fa';
import { IoMdInformationCircleOutline } from 'react-icons/io';

interface NSFWSettings {
  _id?: string;
  pornThreshold: number;
  hentaiThreshold: number;
  sexyThreshold: number;
  combinedThreshold: number;
}

const NSFWSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<NSFWSettings>({
    pornThreshold: 0.15,
    hentaiThreshold: 0.15,
    sexyThreshold: 0.25,
    combinedThreshold: 0.40
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch current settings from backend
  const fetchSettings = async () => {
    try {
      setLoading(true);
        const res = await axios.get(`${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}/api/v1/strapi-admin/nsfw`, {
          headers: {
            "Content-Type": "application/json",
            "x-node-auth-token": `${process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN}`,
          },
        })

      if (res.data?.success && res.data.data?.length > 0) {
        const current = res.data.data[0];
        setSettings({
          _id: current._id,
          pornThreshold: current.pornThreshold ?? 0.15,
          hentaiThreshold: current.hentaiThreshold ?? 0.15,
          sexyThreshold: current.sexyThreshold ?? 0.25,
          combinedThreshold: current.combinedThreshold ?? 0,
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  // Update settings in backend
const handleSave = async () => {
//   if (!settings._id) return alert('No settings record found');

  try {
    setSaving(true);
    setError(null);
    setSuccess(null);

    const res = await axios.put(
      `${process.env.STRAPI_ADMIN_NODE_BACKEND_URL}/api/v1/strapi-admin/nsfw/update`,
      {
        pornThreshold: settings.pornThreshold,
        hentaiThreshold: settings.hentaiThreshold,
        sexyThreshold: settings.sexyThreshold,
        combinedThreshold: settings.combinedThreshold,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-node-auth-token': `${process.env.STRAPI_ADMIN_NODE_AUTH_TOKEN}`,
        },
      }
    );

    if (res.data?.success) {
      setSuccess('Settings updated successfully!');
    } else {
      setError('Failed to update settings');
    }
  } catch (err: any) {
    setError(err.response?.data?.message || 'Failed to save settings');
  } finally {
    setSaving(false);
  }
};


  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSliderChange = (field: keyof NSFWSettings, value: number) => {
    setSettings(prev => ({
      ...prev,
      [field]: parseFloat(value.toString()),
    }));
  };

  const styles = {
    container: {
      background: '#212134',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      maxWidth: '650px',
      margin: '40px auto',
      fontFamily: 'Inter, sans-serif',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '20px',
    },
    titleIcon: {
      color: '#4945ff',
      marginRight: '10px',
    },
    title: {
      fontSize: '22px',
      fontWeight: 600,
      color: '#fff',
    },
    section: {
      marginTop: '20px',
    },
    label: {
      display: 'flex',
      alignItems : 'center',
      fontSize: '14px',
      color: '#fff',
      marginBottom: '6px',
      fontWeight: 500,
    },
    sliderRow: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: '16px',
      gap: '10px',
    },
    slider: {
      flex: 1,
    },
    value: {
      fontSize: '14px',
      fontWeight: 500,
      color: '#ffffff',
      width: '40px',
      textAlign: 'center' as const,
    },
    saveBtn: {
      background: saving ? '#7a77ff' : '#4945ff',
      border: 'none',
      borderRadius: '8px',
      color: '#fff',
      padding: '10px 18px',
      fontSize: '14px',
      fontWeight: 600,
      cursor: saving ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '6px',
      marginTop: '25px',
    },
    alert: {
      marginTop: '15px',
      fontSize: '14px',
      textAlign: 'center' as const,
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <FaShieldAlt size={22} style={styles.titleIcon} />
        <h2 style={styles.title}>NSFW Detection Thresholds</h2>
      </div>

      {loading ? (
        <p>Loading settings...</p>
      ) : (
        <>
          <div style={styles.section}>
            <div style={styles.sliderRow}>
              <label style={styles.label}>
                Porn
                <IoMdInformationCircleOutline
                    size={16}
                    title="Porn probability cutoff"
                    style={{ marginLeft: 6, color: '#6b6b6b', cursor: 'help' }}
                />
                </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.pornThreshold}
                onChange={e => handleSliderChange('pornThreshold', parseFloat(e.target.value))}
                style={styles.slider}
              />
              <span style={styles.value}>{settings.pornThreshold.toFixed(2)}</span>
            </div>

            <div style={styles.sliderRow}>
              <label style={styles.label}>
                Hentai
                <IoMdInformationCircleOutline
                    size={16}
                    title="Hentai probability cutoff"
                    style={{ marginLeft: 6, color: '#6b6b6b', cursor: 'help' }}
                />
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.hentaiThreshold}
                onChange={e => handleSliderChange('hentaiThreshold', parseFloat(e.target.value))}
                style={styles.slider}
              />
              <span style={styles.value}>{settings.hentaiThreshold.toFixed(2)}</span>
            </div>

            <div style={styles.sliderRow}>
               <label style={styles.label}>
                    Sexy
                    <IoMdInformationCircleOutline
                        size={16}
                        title="Sexy probability cutoff"
                        style={{ marginLeft: 6, color: '#6b6b6b', cursor: 'help' }}
                    />
                </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.sexyThreshold}
                onChange={e => handleSliderChange('sexyThreshold', parseFloat(e.target.value))}
                style={styles.slider}
              />
              <span style={styles.value}>{settings.sexyThreshold.toFixed(2)}</span>
            </div>
             <div style={styles.sliderRow}>
              <label style={styles.label}>
                Combined
                <IoMdInformationCircleOutline
                    size={16}
                    title="Sum of NSFW probabilities cutoff"
                    style={{ marginLeft: 6, color: '#6b6b6b', cursor: 'help' }}
                />
                </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={settings.combinedThreshold}
                onChange={e => handleSliderChange('combinedThreshold', parseFloat(e.target.value))}
                style={styles.slider}
              />
              <span style={styles.value}>{settings.combinedThreshold.toFixed(2)}</span>
            </div>
          </div>

          <button style={styles.saveBtn} onClick={handleSave} disabled={saving}>
            <FaSave /> {saving ? 'Saving...' : 'Save Settings'}
          </button>

          {error && <div style={{ ...styles.alert, color: 'red' }}>{error}</div>}
          {success && <div style={{ ...styles.alert, color: 'green' }}>{success}</div>}
        </>
      )}
    </div>
  );
};

export default NSFWSettingsPage;
