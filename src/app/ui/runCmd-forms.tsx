'use client';

import { Member, cmdMember, cmdState } from '@/app/lib/db'; // 경로 확인
import { useState } from 'react';
import ConfirmModal from '@/app/components/ConfirmModal'; // ConfirmModal 컴포넌트 경로 확인

interface FormProps {
  member: Member;
  cmds: string[];
}

interface ButtonLoadingState {
  [key: string]: boolean; // 각 cmd에 대한 로딩 상태를 저장
}

export default function Form({ member, cmds }: FormProps) {
  const [state, setState] = useState<cmdState>({
    message: null,
    errors: {},
    result: {
      current_status: 'No status available', // 기본 상태 메시지
      member_name: 'None',
      cmd: 'None',
      result: 'None'
    }
  });

  // 각 버튼의 로딩 상태를 관리할 상태 변수
  const [loading, setLoading] = useState<ButtonLoadingState>({});
  const [disabled, setDisabled] = useState<boolean>(false); // 버튼 비활성화 상태
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false); // 모달 상태
  const [currentCmd, setCurrentCmd] = useState<string | null>(null); // 현재 클릭된 cmd

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>, cmd: string) => {
    event.preventDefault();
    if (disabled) return; // 비활성화 상태일 때는 모달 열지 않음
    setCurrentCmd(cmd); // 현재 클릭된 cmd 저장
    setIsModalOpen(true); // 모달 열기
  };

  const handleConfirm = async () => {
    if (!currentCmd) return;

    const formData = new FormData(document.querySelector('form') as HTMLFormElement);

    setDisabled(true);
    setLoading((prev) => ({ ...prev, [currentCmd]: true }));

    try {
      const result = await cmdMember(state, formData);
      setState(result);
    } catch (error) {
      console.error('폼 제출 도중 오류 발생:', error);
      setState({
        message: '폼 제출 중 오류가 발생했습니다.',
        errors: {},
        result: {
          current_status: 'No status available', // 오류 발생 시 기본 상태 메시지 유지
          member_name: 'None',
          cmd: 'None',
          result: 'None'
        }
      });
    } finally {
      setDisabled(false);
      setLoading((prev) => ({ ...prev, [currentCmd]: false }));
      setIsModalOpen(false); // 모달 닫기
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false); // 모달 닫기
  };

  const statusColor = state.result?.current_status === 'ACTIVE' ? 'text-green-600' : 'text-red-600';

  return (
    <div className="flex gap-4 overflow-x-auto">
      <div id="status" aria-live="polite" aria-atomic="true">
        <p className={`w-full h-10 px-4 py-2 rounded-lg text-lg font-bold ${statusColor}`}>
          {state.result?.current_status || 'No status available'}
        </p>
      </div>

      {cmds.map((cmd) => (
        <form key={cmd} onSubmit={(e) => handleSubmit(e, cmd)} className="flex flex-col items-center gap-2">
          <input
            id="name"
            name="name"
            type="text"
            className="hidden"
            defaultValue={member.MEMBER_NAME}
            aria-describedby="name-error"
          />
          <input
            id="cmd"
            name="cmd"
            type="text"
            className="hidden"
            defaultValue={cmd}
            aria-describedby="cmd-error"
          />

          <button
            type="submit"
            className={`w-full h-10 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 ${
              disabled
                ? 'bg-gray-400 cursor-not-allowed' // 비활성화 상태 스타일
                : cmd === 'startup'
                ? 'bg-blue-600 hover:bg-blue-500 focus:ring-blue-600'
                : cmd === 'shutdown'
                ? 'bg-red-600 hover:bg-red-500 focus:ring-red-600'
                : cmd === 'join'
                ? 'bg-green-600 hover:bg-green-500 focus:ring-green-600'
                : 'bg-gray-600 hover:bg-gray-500 focus:ring-gray-600'
            }`}
            disabled={disabled} // 버튼 비활성화
          >
            {loading[cmd] ? '로딩 중...' : cmd}
          </button>

          <div id="name-error" aria-live="polite" aria-atomic="true">
            {state.errors?.name?.map((error: string) => (
              <p key={error} className="text-sm text-red-500">{error}</p>
            ))}
          </div>
          <div id="cmd-error" aria-live="polite" aria-atomic="true">
            {state.errors?.cmd?.map((error: string) => (
              <p key={error} className="text-sm text-red-500">{error}</p>
            ))}
          </div>
        </form>
      ))}

      {state.message && <p className="text-sm text-red-500">{state.message}</p>}

      {isModalOpen && !disabled && (
        <ConfirmModal
          isOpen={isModalOpen}
          message={`Are you sure you want to ${currentCmd}?`}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}
