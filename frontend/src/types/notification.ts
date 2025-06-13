export interface Notification {
    _id?: string;
    type: string;
    requestId: string;
    title: string;
    message: string;
    status?: string;
    comment?: string;
    updatedBy: {
      _id: string;
      name: string;
    };
    timestamp: Date;
    read: boolean;
  }