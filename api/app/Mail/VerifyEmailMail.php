<?php
namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class VerifyEmailMail extends Mailable
{
  use Queueable, SerializesModels;

  public string $verifyUrl;

  public function __construct(string $verifyUrl) { $this->verifyUrl = $verifyUrl; }

  public function build() {
    return $this->subject('Verify your email')
      ->view('emails.verify')->with(['verifyUrl'=>$this->verifyUrl]);
  }
}
