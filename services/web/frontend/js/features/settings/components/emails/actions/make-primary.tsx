import Tooltip from '../../../../../shared/components/tooltip'
import { Button } from 'react-bootstrap'
import { useTranslation } from 'react-i18next'
import {
  inReconfirmNotificationPeriod,
  institutionAlreadyLinked,
} from '../../../utils/selectors'
import { postJSON } from '../../../../../infrastructure/fetch-json'
import {
  State,
  useUserEmailsContext,
} from '../../../context/user-email-context'
import { UserEmailData } from '../../../../../../../types/user-email'
import { UseAsyncReturnType } from '../../../../../shared/hooks/use-async'
import { ssoAvailableForInstitution } from '../../../utils/sso'

const getDescription = (
  t: (s: string) => string,
  state: State,
  userEmailData: UserEmailData
) => {
  if (inReconfirmNotificationPeriod(userEmailData)) {
    return t('please_reconfirm_your_affiliation_before_making_this_primary')
  }

  if (userEmailData.confirmedAt) {
    return t('make_email_primary_description')
  }

  const ssoAvailable = ssoAvailableForInstitution(
    userEmailData.affiliation?.institution || null
  )

  if (!institutionAlreadyLinked(state, userEmailData) && ssoAvailable) {
    return t('please_link_before_making_primary')
  }

  return t('please_confirm_your_email_before_making_it_default')
}

function PrimaryButton({ children, disabled, onClick }: Button.ButtonProps) {
  return (
    <Button
      bsSize="small"
      bsStyle={null}
      className="btn-secondary-info btn-secondary"
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

type MakePrimaryProps = {
  userEmailData: UserEmailData
  makePrimaryAsync: UseAsyncReturnType
}

function MakePrimary({ userEmailData, makePrimaryAsync }: MakePrimaryProps) {
  const { t } = useTranslation()
  const { state, makePrimary } = useUserEmailsContext()

  const handleSetDefaultUserEmail = () => {
    makePrimaryAsync
      .runAsync(
        postJSON('/user/emails/default', {
          body: {
            email: userEmailData.email,
          },
        })
      )
      .then(() => {
        makePrimary(userEmailData.email)
      })
      .catch(() => {})
  }

  if (userEmailData.default) {
    return null
  }

  if (makePrimaryAsync.isLoading) {
    return <PrimaryButton disabled>{t('sending')}...</PrimaryButton>
  }

  return (
    <Tooltip
      id={`make-primary-${userEmailData.email}`}
      description={getDescription(t, state, userEmailData)}
    >
      {/*
        Disabled buttons don't work with tooltips, due to pointer-events: none,
        so create a wrapper for the tooltip
      */}
      <span>
        <PrimaryButton
          disabled={
            !userEmailData.confirmedAt ||
            state.isLoading ||
            inReconfirmNotificationPeriod(userEmailData)
          }
          onClick={handleSetDefaultUserEmail}
        >
          {t('make_primary')}
        </PrimaryButton>
      </span>
    </Tooltip>
  )
}

export default MakePrimary
