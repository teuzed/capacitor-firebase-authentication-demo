import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DialogService, FirebaseAuthenticationService } from '@app/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  constructor(
    private readonly firebaseAuthenticationService: FirebaseAuthenticationService,
    private readonly dialogService: DialogService,
    private readonly router: Router,
  ) {}

  public ngOnInit(): void {
    this.firebaseAuthenticationService.getRedirectResult().then((result) => {
      if (result?.user) {
        this.navigateToHome();
      }
    });
    this.firebaseAuthenticationService.phoneVerificationCompleted$.subscribe(
      () => this.navigateToHome(),
    );
    this.firebaseAuthenticationService.phoneCodeSent$.subscribe(
      async (event) => {
        const verificationCode = await this.showInputVerificationCodeAlert();
        if (!verificationCode) {
          return;
        }
        let loadingElement: HTMLIonLoadingElement | undefined;
        try {
          loadingElement = await this.dialogService.showLoading();
          await this.firebaseAuthenticationService.confirmVerificationCode({
            verificationCode,
            verificationId: event.verificationId,
          });
          await this.navigateToHome();
        } finally {
          await loadingElement?.dismiss();
        }
      },
    );
  }


  public async signInWithGoogle(): Promise<void> {
    await this.signInWith(SignInProvider.google);
  }


  public async signInWithPhoneNumber(): Promise<void> {
    let loadingElement: HTMLIonLoadingElement | undefined;
    try {
      const phoneNumber = await this.showInputPhoneNumberAlert();
      if (!phoneNumber) {
        return;
      }
      loadingElement = await this.dialogService.showLoading();
      await this.firebaseAuthenticationService.signInWithPhoneNumber({
        phoneNumber,
      });
      await loadingElement.dismiss();
    } finally {
      await loadingElement?.dismiss();
    }
  }

  private async signInWith(provider: SignInProvider): Promise<void> {
    const loadingElement = await this.dialogService.showLoading();
    try {
      switch (provider) {
        case SignInProvider.google:
          await this.firebaseAuthenticationService.signInWithGoogle();
          break;
      }
      await this.navigateToHome();
    } finally {
      await loadingElement.dismiss();
    }
  }

  private async navigateToHome(): Promise<void> {
    await this.router.navigate(['/home'], { replaceUrl: true });
  }

  private async showInputPhoneNumberAlert(): Promise<string | undefined> {
    const data = await this.dialogService.showInputAlert({
      inputs: [
        {
          name: 'phoneNumber',
          type: 'text',
          placeholder: 'Phone Number',
        },
      ],
    });
    if (!data) {
      return;
    }
    return data.phoneNumber;
  }

  private async showInputVerificationCodeAlert(): Promise<string | undefined> {
    const data = await this.dialogService.showInputAlert({
      inputs: [
        {
          name: 'verificationCode',
          type: 'text',
          placeholder: 'Verification Code',
        },
      ],
    });
    if (!data) {
      return;
    }
    return data.verificationCode;
  }
}

enum SignInProvider {
  google = 'google',
}
