import React, { useState, useEffect } from 'react';
import { getFirestore, collection, doc, setDoc, updateDoc, deleteDoc, getDocs, onSnapshot, query, where } from 'firebase/firestore';
import { FIREBASE_PATHS, COMPANY_CONFIG, COMPANY_BENEFITS, LOG_TYPES } from '../constants/gameConstants.js';
import Button from './Button.jsx';

export default function CompanyInterface({ user, player, addToLog, playSound }) {
  const [companies, setCompanies] = useState([]);
  const [playerCompany, setPlayerCompany] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [companyDescription, setCompanyDescription] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const db = getFirestore();

  // Load companies and player's company
  useEffect(() => {
    const companiesQuery = query(collection(db, FIREBASE_PATHS.COMPANIES));
    const unsubscribe = onSnapshot(companiesQuery, (snapshot) => {
      const companiesList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCompanies(companiesList);

      // Find player's company
      const myCompany = companiesList.find(company => 
        company.members && company.members[user.uid]
      );
      setPlayerCompany(myCompany);
    });

    return unsubscribe;
  }, [db, user.uid]);

  // Generate unique company code
  const generateCompanyCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Create new company
  const createCompany = async () => {
    if (!companyName.trim() || companyName.length < COMPANY_CONFIG.MIN_NAME_LENGTH) {
      addToLog(`Company name must be at least ${COMPANY_CONFIG.MIN_NAME_LENGTH} characters long!`, LOG_TYPES.WARNING);
      return;
    }

    if (companyName.length > COMPANY_CONFIG.MAX_NAME_LENGTH) {
      addToLog(`Company name cannot exceed ${COMPANY_CONFIG.MAX_NAME_LENGTH} characters!`, LOG_TYPES.WARNING);
      return;
    }

    if (player.credits < COMPANY_CONFIG.CREATION_COST) {
      addToLog(`Insufficient credits! Company creation costs $${COMPANY_CONFIG.CREATION_COST.toLocaleString()}`, LOG_TYPES.WARNING);
      return;
    }

    setLoading(true);
    try {
      const companyCode = generateCompanyCode();
      const companyId = `company_${Date.now()}`;
      
      const newCompany = {
        id: companyId,
        name: companyName.trim(),
        description: companyDescription.trim() || 'A new trading company',
        code: companyCode,
        founderId: user.uid,
        founderName: player.name,
        treasury: 0,
        members: {
          [user.uid]: {
            name: player.name,
            role: COMPANY_CONFIG.MEMBER_ROLES.FOUNDER,
            joinedAt: new Date().toISOString(),
            contributedCredits: COMPANY_CONFIG.CREATION_COST
          }
        },
        memberCount: 1,
        createdAt: new Date().toISOString(),
        totalTrades: 0,
        totalRevenue: 0
      };

      // Create company document
      await setDoc(doc(db, FIREBASE_PATHS.COMPANIES, companyId), newCompany);

      // Deduct creation cost from player
      const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
      await updateDoc(playerRef, {
        credits: player.credits - COMPANY_CONFIG.CREATION_COST,
        companyId: companyId
      });

      addToLog(`🏢 Company "${companyName}" created successfully! Company code: ${companyCode}`, LOG_TYPES.SUCCESS);
      playSound('ACHIEVEMENT');
      
      setShowCreateForm(false);
      setCompanyName('');
      setCompanyDescription('');
    } catch (error) {
      addToLog(`Company creation failed: ${error.message}`, LOG_TYPES.WARNING);
    } finally {
      setLoading(false);
    }
  };

  // Join existing company
  const joinCompany = async () => {
    if (!joinCode.trim()) {
      addToLog('Please enter a company code!', LOG_TYPES.WARNING);
      return;
    }

    setLoading(true);
    try {
      const targetCompany = companies.find(c => c.code === joinCode.toUpperCase());
      
      if (!targetCompany) {
        addToLog('Company not found! Check the company code.', LOG_TYPES.WARNING);
        setLoading(false);
        return;
      }

      if (targetCompany.memberCount >= COMPANY_CONFIG.MAX_MEMBERS) {
        addToLog('Company is at maximum capacity!', LOG_TYPES.WARNING);
        setLoading(false);
        return;
      }

      if (targetCompany.members[user.uid]) {
        addToLog('You are already a member of this company!', LOG_TYPES.WARNING);
        setLoading(false);
        return;
      }

      // Add player to company
      const companyRef = doc(db, FIREBASE_PATHS.COMPANIES, targetCompany.id);
      await updateDoc(companyRef, {
        [`members.${user.uid}`]: {
          name: player.name,
          role: COMPANY_CONFIG.MEMBER_ROLES.MEMBER,
          joinedAt: new Date().toISOString(),
          contributedCredits: 0
        },
        memberCount: targetCompany.memberCount + 1
      });

      // Update player's company reference
      const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
      await updateDoc(playerRef, {
        companyId: targetCompany.id
      });

      addToLog(`🏢 Successfully joined "${targetCompany.name}"!`, LOG_TYPES.SUCCESS);
      playSound('ACHIEVEMENT');
      
      setShowJoinForm(false);
      setJoinCode('');
    } catch (error) {
      addToLog(`Failed to join company: ${error.message}`, LOG_TYPES.WARNING);
    } finally {
      setLoading(false);
    }
  };

  // Leave company
  const leaveCompany = async () => {
    if (!playerCompany) return;

    const isFounder = playerCompany.founderId === user.uid;
    
    if (isFounder && playerCompany.memberCount > 1) {
      addToLog('Cannot leave company as founder with other members. Transfer leadership or disband the company first.', LOG_TYPES.WARNING);
      return;
    }

    setLoading(true);
    try {
      if (isFounder) {
        // Disband company if founder is leaving and no other members
        await deleteDoc(doc(db, FIREBASE_PATHS.COMPANIES, playerCompany.id));
        addToLog(`🏢 Company "${playerCompany.name}" has been disbanded.`, LOG_TYPES.SUCCESS);
      } else {
        // Remove member from company
        const companyRef = doc(db, FIREBASE_PATHS.COMPANIES, playerCompany.id);
        const updatedMembers = { ...playerCompany.members };
        delete updatedMembers[user.uid];
        
        await updateDoc(companyRef, {
          members: updatedMembers,
          memberCount: playerCompany.memberCount - 1
        });
        
        addToLog(`Left company "${playerCompany.name}".`, LOG_TYPES.SUCCESS);
      }

      // Remove company reference from player
      const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
      await updateDoc(playerRef, {
        companyId: null
      });

    } catch (error) {
      addToLog(`Failed to leave company: ${error.message}`, LOG_TYPES.WARNING);
    } finally {
      setLoading(false);
    }
  };

  // Deposit credits to company treasury
  const depositCredits = async (amount) => {
    if (!playerCompany || amount <= 0 || amount > player.credits) {
      addToLog('Invalid deposit amount!', LOG_TYPES.WARNING);
      return;
    }

    setLoading(true);
    try {
      // Update company treasury
      const companyRef = doc(db, FIREBASE_PATHS.COMPANIES, playerCompany.id);
      await updateDoc(companyRef, {
        treasury: playerCompany.treasury + amount,
        [`members.${user.uid}.contributedCredits`]: (playerCompany.members[user.uid].contributedCredits || 0) + amount
      });

      // Deduct from player credits
      const playerRef = doc(db, FIREBASE_PATHS.PLAYERS, user.uid);
      await updateDoc(playerRef, {
        credits: player.credits - amount
      });

      addToLog(`💰 Deposited $${amount.toLocaleString()} to company treasury.`, LOG_TYPES.SUCCESS);
      playSound('CREDITS_GAIN');
    } catch (error) {
      addToLog(`Deposit failed: ${error.message}`, LOG_TYPES.WARNING);
    } finally {
      setLoading(false);
    }
  };

  const playerRole = playerCompany?.members[user.uid]?.role;
  const hasPermission = (permission) => {
    if (!playerRole) return false;
    return COMPANY_CONFIG.PERMISSIONS[playerRole]?.includes(permission) || false;
  };

  if (!playerCompany) {
    return (
      <div className="bg-purple-900 border-2 border-purple-500 p-4 text-white font-mono rounded-lg">
        <h3 className="text-lg mb-3 pb-2 border-b border-purple-400 font-bold">🏢 COMPANY MANAGEMENT</h3>
        
        <div className="mb-4">
          <p className="text-purple-200 text-sm mb-3">
            Join forces with other traders! Companies provide shared resources, benefits, and strategic advantages.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-purple-800 p-3 rounded border border-purple-600">
              <h4 className="font-semibold mb-2">Company Benefits:</h4>
              <ul className="text-xs space-y-1">
                <li>• {(COMPANY_BENEFITS.FUEL_DISCOUNT * 100)}% fuel discount</li>
                <li>• {(COMPANY_BENEFITS.REPAIR_DISCOUNT * 100)}% repair discount</li>
                <li>• {(COMPANY_BENEFITS.TRADE_BONUS * 100)}% trade bonus</li>
                <li>• Shared sector intelligence</li>
                <li>• Emergency fund access</li>
              </ul>
            </div>
            
            <div className="bg-purple-800 p-3 rounded border border-purple-600">
              <h4 className="font-semibold mb-2">Active Companies:</h4>
              <div className="text-xs max-h-20 overflow-y-auto">
                {companies.length > 0 ? (
                  companies.map(company => (
                    <div key={company.id} className="mb-1">
                      <span className="font-medium">{company.name}</span>
                      <span className="text-purple-300"> ({company.memberCount}/{COMPANY_CONFIG.MAX_MEMBERS})</span>
                    </div>
                  ))
                ) : (
                  <p className="text-purple-300">No companies exist yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={() => setShowCreateForm(true)} 
            variant="primary" 
            size="sm"
            disabled={player.credits < COMPANY_CONFIG.CREATION_COST}
          >
            Create Company (${COMPANY_CONFIG.CREATION_COST.toLocaleString()})
          </Button>
          
          <Button 
            onClick={() => setShowJoinForm(true)} 
            variant="secondary" 
            size="sm"
          >
            Join Company
          </Button>
        </div>

        {/* Create Company Form */}
        {showCreateForm && (
          <div className="mt-4 p-3 bg-purple-800 rounded border border-purple-600">
            <h4 className="font-semibold mb-3">Create New Company</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1">Company Name:</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  maxLength={COMPANY_CONFIG.MAX_NAME_LENGTH}
                  className="w-full bg-black text-white p-2 rounded border border-purple-600"
                  placeholder="Enter company name..."
                />
              </div>
              <div>
                <label className="block text-xs mb-1">Description (optional):</label>
                <textarea
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  maxLength={200}
                  rows={2}
                  className="w-full bg-black text-white p-2 rounded border border-purple-600"
                  placeholder="Describe your company..."
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={createCompany} variant="success" size="sm" disabled={loading}>
                  {loading ? 'Creating...' : 'Create'}
                </Button>
                <Button onClick={() => setShowCreateForm(false)} variant="secondary" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Join Company Form */}
        {showJoinForm && (
          <div className="mt-4 p-3 bg-purple-800 rounded border border-purple-600">
            <h4 className="font-semibold mb-3">Join Existing Company</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1">Company Code:</label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="w-full bg-black text-white p-2 rounded border border-purple-600"
                  placeholder="Enter 6-character code..."
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={joinCompany} variant="success" size="sm" disabled={loading}>
                  {loading ? 'Joining...' : 'Join'}
                </Button>
                <Button onClick={() => setShowJoinForm(false)} variant="secondary" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Player is in a company - show company management
  return (
    <div className="bg-purple-900 border-2 border-purple-500 p-4 text-white font-mono rounded-lg">
      <h3 className="text-lg mb-3 pb-2 border-b border-purple-400 font-bold">
        🏢 {playerCompany.name}
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Company Info */}
        <div className="bg-purple-800 p-3 rounded border border-purple-600">
          <h4 className="font-semibold mb-2">Company Information</h4>
          <div className="text-xs space-y-1">
            <div><span className="text-purple-300">Code:</span> {playerCompany.code}</div>
            <div><span className="text-purple-300">Members:</span> {playerCompany.memberCount}/{COMPANY_CONFIG.MAX_MEMBERS}</div>
            <div><span className="text-purple-300">Treasury:</span> ${playerCompany.treasury.toLocaleString()}</div>
            <div><span className="text-purple-300">Your Role:</span> {playerRole}</div>
            <div><span className="text-purple-300">Founded:</span> {new Date(playerCompany.createdAt).toLocaleDateString()}</div>
          </div>
        </div>

        {/* Company Members */}
        <div className="bg-purple-800 p-3 rounded border border-purple-600">
          <h4 className="font-semibold mb-2">Members</h4>
          <div className="text-xs max-h-24 overflow-y-auto space-y-1">
            {Object.entries(playerCompany.members).map(([memberId, member]) => (
              <div key={memberId} className="flex justify-between">
                <span className={memberId === user.uid ? 'text-yellow-400' : ''}>
                  {member.name}
                </span>
                <span className="text-purple-300">{member.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Company Actions */}
      <div className="space-y-3">
        {/* Treasury Management */}
        <div className="bg-purple-800 p-3 rounded border border-purple-600">
          <h4 className="font-semibold mb-2">Treasury Management</h4>
          <div className="flex gap-2 items-center">
            <Button 
              onClick={() => depositCredits(1000)} 
              variant="success" 
              size="sm"
              disabled={loading || player.credits < 1000}
            >
              Deposit $1K
            </Button>
            <Button 
              onClick={() => depositCredits(10000)} 
              variant="success" 
              size="sm"
              disabled={loading || player.credits < 10000}
            >
              Deposit $10K
            </Button>
            <Button 
              onClick={() => depositCredits(Math.min(player.credits, 50000))} 
              variant="success" 
              size="sm"
              disabled={loading || player.credits < 1000}
            >
              Deposit Max
            </Button>
          </div>
        </div>

        {/* Company Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={leaveCompany} 
            variant="danger" 
            size="sm"
            disabled={loading}
          >
            {playerCompany.founderId === user.uid ? 'Disband Company' : 'Leave Company'}
          </Button>
        </div>
      </div>

      <div className="mt-3 text-xs text-purple-300">
        <p>💡 Company members receive automatic discounts and bonuses on trades!</p>
      </div>
    </div>
  );
}
