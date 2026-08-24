import * as S from './styled';

export default function EmptyMailboxPanel() {
    return (
        <S.Panel>
            <S.PanelHeader>
                <S.PanelTitle>Emails</S.PanelTitle>
            </S.PanelHeader>
            <S.PanelBody>
                <S.EmptyState>Select a mailbox to view emails</S.EmptyState>
            </S.PanelBody>
        </S.Panel>
    );
}
