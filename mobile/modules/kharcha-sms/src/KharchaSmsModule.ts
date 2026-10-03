import { NativeModule, requireNativeModule } from 'expo';

declare class KharchaSmsModule extends NativeModule<{}> {
  listMessages(senders: string[], since: number): Promise<Array<{
    sender: string;
    body: string;
    receivedAt: number;
  }>>;
}

export default requireNativeModule<KharchaSmsModule>('KharchaSms');
