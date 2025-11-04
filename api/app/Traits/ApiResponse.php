<?php

// app/Traits/ApiResponse.php
trait ApiResponse {
  protected function apiError(string $msg, int $http, array $codes) {
    return response()->json(['message'=>$msg,'errors'=>$codes], $http);
  }
}
