<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class VerifyEmailMail extends Mailable
{
  use Queueable, SerializesModels;

  public string $verifyUrl;
  public string $appName;
  public int $expiresMinutes;

  public function __construct(string $verifyUrl, array $options = [])
  {
    $this->verifyUrl    = $verifyUrl;
    $this->expiresMinutes = $options['expiresMinutes'] ?? 60;
    $this->appName     = $options['appName'] ?? config('app.name');
  }

  public function build()
  {
    return $this
      ->subject('Verify your email address')
      ->view('emails.verify-email')
      ->with([
        'verifyUrl'    => $this->verifyUrl,
        'expiresMinutes'      => $this->expiresMinutes,
        'appName'      => $this->appName,
      ]);
  }
}
