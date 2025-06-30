import { writable } from 'svelte/store';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export interface CollaborativeUser {
    id: string;
    name: string;
    color: string;
    cursorPosition: number;
    isGuest: boolean;
}

export interface CollaborationState {
    isConnected: boolean;
    users: CollaborativeUser[];
    roomId: string | null;
    provider: WebsocketProvider | null;
    ydoc: Y.Doc | null;
    ytext: Y.Text | null;
}

function createCollaborationStore() {
    const { subscribe, set, update } = writable<CollaborationState>({
        isConnected: false,
        users: [],
        roomId: null,
        provider: null,
        ydoc: null,
        ytext: null
    });

    return {
        subscribe,
        
        connect: (roomId: string, userId?: string, userName?: string) => {
            update(state => {
                // Clean up existing connection
                if (state.provider) {
                    state.provider.destroy();
                }
                if (state.ydoc) {
                    state.ydoc.destroy();
                }

                // Create new YJS document and provider
                const ydoc = new Y.Doc();
                const provider = new WebsocketProvider('ws://localhost:1234', roomId, ydoc);
                const ytext = ydoc.getText('content');

                // Handle connection status
                provider.on('status', (event: any) => {
                    update(s => ({ ...s, isConnected: event.status === 'connected' }));
                });

                // Handle awareness (user presence)
                provider.awareness.on('change', () => {
                    const users: CollaborativeUser[] = [];
                    provider.awareness.getStates().forEach((state: any, clientId: number) => {
                        if (state.user) {
                            users.push({
                                id: state.user.id || clientId.toString(),
                                name: state.user.name || 'Anonymous',
                                color: state.user.color || '#3B82F6',
                                cursorPosition: state.cursor?.position || 0,
                                isGuest: !state.user.id
                            });
                        }
                    });
                    update(s => ({ ...s, users }));
                });

                // Set local user info
                if (userId && userName) {
                    provider.awareness.setLocalStateField('user', {
                        id: userId,
                        name: userName,
                        color: generateUserColor(userId)
                    });
                } else {
                    provider.awareness.setLocalStateField('user', {
                        name: 'Guest',
                        color: generateUserColor('guest-' + Date.now())
                    });
                }

                return {
                    ...state,
                    roomId,
                    provider,
                    ydoc,
                    ytext,
                    isConnected: false
                };
            });
        },

        disconnect: () => {
            update(state => {
                if (state.provider) {
                    state.provider.destroy();
                }
                if (state.ydoc) {
                    state.ydoc.destroy();
                }

                return {
                    isConnected: false,
                    users: [],
                    roomId: null,
                    provider: null,
                    ydoc: null,
                    ytext: null
                };
            });
        },

        updateCursor: (position: number) => {
            update(state => {
                if (state.provider) {
                    state.provider.awareness.setLocalStateField('cursor', { position });
                }
                return state;
            });
        }
    };
}

function generateUserColor(userId: string): string {
    const colors = [
        '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
        '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'
    ];
    
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
}

export const collaborationStore = createCollaborationStore();